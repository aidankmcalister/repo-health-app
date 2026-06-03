"use server";

import prisma from "@/app/lib/prisma";
import {
  assertOwnedDashboard,
  reconcileRepos,
  type RepoRef,
} from "@/lib/dashboard-repos";
import { SYNC_COOLDOWN_MS } from "@/lib/cooldown";
import { syncRepo } from "@/lib/github/sync";
import { requireUser } from "@/lib/session";
import { revalidatePath } from "next/cache";

type DashboardResult = {
  ok: boolean;
  dashboardId?: string;
  failed?: string[];
  error?: string;
};

/** Creates a dashboard with a name, optional description, and initial repos. */
export async function createDashboardWithRepos(
  name: string,
  description: string,
  repos: RepoRef[],
): Promise<DashboardResult> {
  try {
    const user = await requireUser();
    const trimmed = name.trim();
    if (!trimmed) {
      return { ok: false, error: "Dashboard name is required." };
    }

    const dashboard = await prisma.dashboard.create({
      data: { name: trimmed, description: cleanDescription(description), userId: user.id },
    });

    const { failed } = await reconcileRepos(user.id, dashboard.id, repos);

    revalidatePath("/");
    return { ok: true, dashboardId: dashboard.id, failed };
  } catch (error) {
    return { ok: false, error: messageFor(error, "Failed to create dashboard.") };
  }
}

/** Updates a dashboard's name, description, highlighted view, and repo set. */
export async function updateDashboard(
  dashboardId: string,
  name: string,
  description: string,
  highlightViewId: string | null,
  repos: RepoRef[],
): Promise<DashboardResult> {
  try {
    const user = await requireUser();
    const trimmed = name.trim();
    if (!trimmed) {
      return { ok: false, error: "Dashboard name is required." };
    }

    await assertOwnedDashboard(dashboardId, user.id);
    await prisma.dashboard.update({
      where: { id: dashboardId },
      data: {
        name: trimmed,
        description: cleanDescription(description),
        highlightViewId: await resolveHighlight(dashboardId, highlightViewId),
      },
    });

    const { failed } = await reconcileRepos(user.id, dashboardId, repos);

    revalidatePath("/");
    revalidatePath(`/dashboard/${dashboardId}`);
    return { ok: true, dashboardId, failed };
  } catch (error) {
    return { ok: false, error: messageFor(error, "Failed to update dashboard.") };
  }
}

/**
 * Manually syncs every repo on a dashboard, rate-limited to once per 30 minutes.
 * Returns the cooldown error when triggered too soon.
 */
export async function syncDashboardNow(
  dashboardId: string,
): Promise<DashboardResult> {
  try {
    const user = await requireUser();
    await assertOwnedDashboard(dashboardId, user.id);

    const dashboard = await prisma.dashboard.findUnique({
      where: { id: dashboardId },
      select: { lastSyncedAt: true },
    });

    if (dashboard?.lastSyncedAt) {
      const elapsed = Date.now() - dashboard.lastSyncedAt.getTime();
      if (elapsed < SYNC_COOLDOWN_MS) {
        const minutes = Math.ceil((SYNC_COOLDOWN_MS - elapsed) / 60000);
        return { ok: false, error: `Try again in ${minutes} min.` };
      }
    }

    const links = await prisma.dashboardRepo.findMany({
      where: { dashboardId },
      select: { repoId: true },
    });
    for (const link of links) {
      await syncRepo(link.repoId).catch(() => null);
    }

    await prisma.dashboard.update({
      where: { id: dashboardId },
      data: { lastSyncedAt: new Date() },
    });

    revalidatePath(`/dashboard/${dashboardId}`);
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: messageFor(error, "Failed to sync.") };
  }
}

/** Deletes a dashboard the current user owns (cascades its links and views). */
export async function deleteDashboard(dashboardId: string): Promise<DashboardResult> {
  try {
    const user = await requireUser();
    await assertOwnedDashboard(dashboardId, user.id);
    await prisma.dashboard.delete({ where: { id: dashboardId } });

    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: messageFor(error, "Failed to delete dashboard.") };
  }
}

function cleanDescription(description: string): string | null {
  const trimmed = description.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Keeps a highlight only if it points at a view on this dashboard. */
async function resolveHighlight(
  dashboardId: string,
  highlightViewId: string | null,
): Promise<string | null> {
  if (!highlightViewId) return null;
  const view = await prisma.view.findFirst({
    where: { id: highlightViewId, dashboardId },
    select: { id: true },
  });
  return view ? view.id : null;
}

function messageFor(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
