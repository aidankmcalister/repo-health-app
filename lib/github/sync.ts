import prisma from "@/app/lib/prisma";
import { REPO_METRICS } from "@/lib/metrics";
import { getGithubAccessToken } from "./client";
import { fetchRepoData, type RepoData } from "./repo";

/**
 * Writes one Snapshot row per metric and refreshes the repo's cached fields.
 * Shared by the add-repo action (which already holds fresh data) and the cron
 * sync, so a capture is recorded the same way everywhere.
 */
export async function persistRepoData(
  repoId: string,
  data: RepoData,
): Promise<void> {
  const date = new Date();

  await prisma.$transaction([
    prisma.snapshot.createMany({
      data: REPO_METRICS.map((metric) => ({
        repoId,
        metric,
        value: data.metrics[metric],
        date,
      })),
    }),
    prisma.repo.update({
      where: { id: repoId },
      data: {
        stars: data.metrics.stars,
        openIssues: data.metrics.open_issues,
        defaultBranch: data.defaultBranch,
        lastSyncedAt: date,
      },
    }),
  ]);
}

/**
 * Finds a GitHub token that can see this repo by trying the tokens of the users
 * who track it, then records a fresh capture. Returns false when no tracking
 * user has a usable token (e.g. the repo is private and they all signed out).
 */
export async function syncRepo(repoId: string): Promise<boolean> {
  const repo = await prisma.repo.findUnique({ where: { id: repoId } });
  if (!repo) {
    throw new Error(`Repo ${repoId} not found.`);
  }

  for (const userId of await trackingUserIds(repoId)) {
    const token = await getGithubAccessToken(userId).catch(() => null);
    if (!token) {
      continue;
    }

    const data = await fetchRepoData(token, repo.owner, repo.name);
    if (data) {
      await persistRepoData(repoId, data);
      return true;
    }
  }

  return false;
}

/** Distinct ids of users whose dashboards include this repo. */
async function trackingUserIds(repoId: string): Promise<string[]> {
  const links = await prisma.dashboardRepo.findMany({
    where: { repoId },
    select: { dashboard: { select: { userId: true } } },
  });

  return [...new Set(links.map((link) => link.dashboard.userId))];
}
