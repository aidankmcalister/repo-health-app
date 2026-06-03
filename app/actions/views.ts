"use server";

import type { Prisma } from "@/app/generated/prisma/client";
import prisma from "@/app/lib/prisma";
import { assertOwnedDashboard } from "@/lib/dashboard-repos";
import { REPO_METRICS, type RepoMetric } from "@/lib/metrics";
import { requireUser } from "@/lib/session";
import {
  ALIASES,
  VIEW_TYPE_NUMBER,
  defaultShowLegend,
  isValidViewType,
  type ViewConfig,
} from "@/lib/views";
import { revalidatePath } from "next/cache";

type ActionResult = { ok: boolean; error?: string };

const ALLOWED_METRICS = new Set<string>(REPO_METRICS);
const ALLOWED_ALIASES = new Set(ALIASES);

/** Creates a view for a dashboard from its type, datapoints, and formula. */
export async function createView(
  dashboardId: string,
  type: string,
  config: ViewConfig,
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await assertOwnedDashboard(dashboardId, user.id);

    if (!isValidViewType(type)) {
      return { ok: false, error: "Unknown view type." };
    }

    const validated = await validateConfig(dashboardId, config);
    if ("error" in validated) {
      return { ok: false, error: validated.error };
    }

    const order = await prisma.view.count({ where: { dashboardId } });
    await prisma.view.create({
      data: {
        dashboardId,
        type,
        order,
        config: validated.config as unknown as Prisma.InputJsonValue,
      },
    });

    revalidatePath(`/dashboard/${dashboardId}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: messageFor(error, "Failed to create view.") };
  }
}

/** Updates an existing view the current user owns (via its dashboard). */
export async function updateView(
  viewId: string,
  type: string,
  config: ViewConfig,
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const view = await prisma.view.findUnique({
      where: { id: viewId },
      select: { dashboardId: true },
    });
    if (!view) {
      return { ok: false, error: "View not found." };
    }

    await assertOwnedDashboard(view.dashboardId, user.id);

    if (!isValidViewType(type)) {
      return { ok: false, error: "Unknown view type." };
    }

    const validated = await validateConfig(view.dashboardId, config);
    if ("error" in validated) {
      return { ok: false, error: validated.error };
    }

    await prisma.view.update({
      where: { id: viewId },
      data: {
        type,
        config: validated.config as unknown as Prisma.InputJsonValue,
      },
    });

    revalidatePath(`/dashboard/${view.dashboardId}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: messageFor(error, "Failed to update view.") };
  }
}

/** Deletes a view the current user owns (via its dashboard). */
export async function deleteView(viewId: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const view = await prisma.view.findUnique({
      where: { id: viewId },
      select: { dashboardId: true },
    });
    if (!view) {
      return { ok: false, error: "View not found." };
    }

    await assertOwnedDashboard(view.dashboardId, user.id);
    await prisma.view.delete({ where: { id: viewId } });
    await prisma.dashboard.updateMany({
      where: { id: view.dashboardId, highlightViewId: viewId },
      data: { highlightViewId: null },
    });

    revalidatePath(`/dashboard/${view.dashboardId}`);
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: messageFor(error, "Failed to delete view.") };
  }
}

async function validateConfig(
  dashboardId: string,
  config: ViewConfig,
): Promise<{ config: ViewConfig } | { error: string }> {
  const datapoints = config.datapoints ?? [];
  if (datapoints.length === 0) {
    return { error: "Add at least one data point." };
  }
  if (datapoints.length > ALIASES.length) {
    return { error: "A view can have at most 26 data points." };
  }

  const seenAliases = new Set<string>();
  for (const point of datapoints) {
    if (!ALLOWED_ALIASES.has(point.alias) || seenAliases.has(point.alias)) {
      return { error: "Data points must use unique labels A–Z." };
    }
    seenAliases.add(point.alias);
    if (!ALLOWED_METRICS.has(point.metric)) {
      return { error: `Unknown metric: ${point.metric}.` };
    }
  }

  const repoIds = [...new Set(datapoints.map((point) => point.repoId))];
  const linkedCount = await prisma.dashboardRepo.count({
    where: { dashboardId, repoId: { in: repoIds } },
  });
  if (linkedCount !== repoIds.length) {
    return { error: "A data point references a repo not on this dashboard." };
  }

  const formula = config.formula?.trim() ?? "";
  const title = config.title?.trim() ?? "";
  const subtitle = config.subtitle?.trim() ?? "";
  const prefix = config.prefix?.trim() ?? "";
  const postfix = config.postfix?.trim() ?? "";
  return {
    config: {
      title: title.length > 0 ? title : "Untitled view",
      subtitle: subtitle.length > 0 ? subtitle : null,
      datapoints: datapoints.map((point) => ({
        alias: point.alias,
        repoId: point.repoId,
        metric: point.metric as RepoMetric,
      })),
      formula: formula.length > 0 ? formula : null,
      prefix: prefix.length > 0 ? prefix : null,
      postfix: postfix.length > 0 ? postfix : null,
      showLegend:
        typeof config.showLegend === "boolean"
          ? config.showLegend
          : defaultShowLegend(VIEW_TYPE_NUMBER),
    },
  };
}

function messageFor(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
