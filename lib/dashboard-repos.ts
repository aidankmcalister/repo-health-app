import prisma from "@/app/lib/prisma";
import { backfillRepo } from "@/lib/github/backfill";
import { getGithubAccessToken } from "@/lib/github/client";
import { fetchRepoData } from "@/lib/github/repo";
import { REPO_METRICS } from "@/lib/metrics";
import { after } from "next/server";

export type RepoRef = { owner: string; name: string };

/** Throws unless the dashboard exists and belongs to the given user. */
export async function assertOwnedDashboard(
  dashboardId: string,
  userId: string,
): Promise<void> {
  const dashboard = await prisma.dashboard.findUnique({
    where: { id: dashboardId },
    select: { userId: true },
  });

  if (!dashboard || dashboard.userId !== userId) {
    throw new Error("Dashboard not found.");
  }
}

/**
 * Validates a repo against the user's GitHub token, dedupes it on (owner, name),
 * links it to the dashboard, and records an initial snapshot. Throws if the
 * token can't see the repo. Idempotent on (dashboardId, repoId).
 */
export async function linkRepo(
  userId: string,
  dashboardId: string,
  owner: string,
  name: string,
): Promise<void> {
  const token = await getGithubAccessToken(userId);
  const data = await fetchRepoData(token, owner, name);
  if (!data) {
    throw new Error(`Repo ${owner}/${name} not found or not accessible.`);
  }

  // Whether this repo is brand new (so we backfill history once).
  const existing = await prisma.repo.findUnique({
    where: { owner_name: { owner: data.owner, name: data.name } },
    select: { id: true },
  });

  const date = new Date();
  const repoData = {
    stars: data.metrics.stars,
    openIssues: data.metrics.open_issues,
    defaultBranch: data.defaultBranch,
    lastSyncedAt: date,
  };

  // Link, cache fields, and first snapshot together so a repo is never left
  // linked-but-unsynced if a later step fails.
  const repoId = await prisma.$transaction(async (tx) => {
    const repo = await tx.repo.upsert({
      where: { owner_name: { owner: data.owner, name: data.name } },
      update: repoData,
      create: { owner: data.owner, name: data.name, ...repoData },
    });
    await tx.dashboardRepo.upsert({
      where: { dashboardId_repoId: { dashboardId, repoId: repo.id } },
      update: {},
      create: { dashboardId, repoId: repo.id },
    });
    await tx.snapshot.createMany({
      data: REPO_METRICS.map((metric) => ({
        repoId: repo.id,
        metric,
        value: data.metrics[metric],
        date,
      })),
    });
    return repo.id;
  });

  // First time we've ever seen this repo: reconstruct ~90 days of history in the
  // background (after the response) so adding a repo returns immediately. The
  // repo stays backfilledAt=null until it finishes, which the UI shows as
  // "Backfilling…".
  if (!existing) {
    after(() =>
      backfillRepo(token, data.owner, data.name, repoId, data.metrics).catch(
        () => null,
      ),
    );
  }
}

/** Unlinks a repo from a dashboard. Leaves the shared Repo in place. */
export async function unlinkRepo(
  dashboardId: string,
  repoId: string,
): Promise<void> {
  await prisma.dashboardRepo.deleteMany({ where: { dashboardId, repoId } });
}

/**
 * Brings a dashboard's repo set in line with `desired`: links repos that are
 * newly selected and unlinks ones that were removed. Returns the "owner/name"
 * of any repos that couldn't be added (e.g. a mistyped custom entry).
 */
export async function reconcileRepos(
  userId: string,
  dashboardId: string,
  desired: RepoRef[],
): Promise<{ failed: string[] }> {
  const current = await prisma.dashboardRepo.findMany({
    where: { dashboardId },
    select: { repoId: true, repo: { select: { owner: true, name: true } } },
  });

  const desiredKeys = new Set(desired.map((repo) => key(repo.owner, repo.name)));
  const currentKeys = new Set(
    current.map((link) => key(link.repo.owner, link.repo.name)),
  );

  const failed: string[] = [];
  for (const repo of desired) {
    if (currentKeys.has(key(repo.owner, repo.name))) {
      continue;
    }
    try {
      await linkRepo(userId, dashboardId, repo.owner, repo.name);
    } catch {
      failed.push(`${repo.owner}/${repo.name}`);
    }
  }

  for (const link of current) {
    if (!desiredKeys.has(key(link.repo.owner, link.repo.name))) {
      await unlinkRepo(dashboardId, link.repoId);
    }
  }

  return { failed };
}

function key(owner: string, name: string): string {
  return `${owner}/${name}`.toLowerCase();
}
