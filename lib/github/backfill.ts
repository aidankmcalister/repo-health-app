import prisma from "@/app/lib/prisma";
import type { RepoMetric } from "@/lib/metrics";
import { getGithubAccessToken, githubGraphql } from "./client";
import { fetchRepoData } from "./repo";

const DAY_MS = 86_400_000;
const WINDOW_DAYS = 90;
const PAGE_SIZE = 100;
const MAX_PAGES = 20; // cap cost; beyond this a metric is left flat to avoid bad data
const SEARCH_MAX_PAGES = 10; // GitHub search hard-caps at 1000 results (10 pages)

type CurrentMetrics = Record<RepoMetric, number>;
type EventDates = { dates: number[]; capped: boolean };

/**
 * Reconstructs up to 90 days of daily history for a freshly added repo by
 * walking backward from its current values using GitHub's per-item timestamps
 * (issue/PR opened-closed-merged, star/fork created). Writes one snapshot per
 * (metric, day). Only metrics whose event list fits within the page cap are
 * reconstructed; others keep just their current snapshot.
 */
export async function backfillRepo(
  token: string,
  owner: string,
  name: string,
  repoId: string,
  current: CurrentMetrics,
): Promise<void> {
  const now = Date.now();
  const startMs = now - WINDOW_DAYS * DAY_MS;
  const since = new Date(startMs).toISOString().slice(0, 10);

  const [
    issueCreated,
    issueClosed,
    prCreated,
    prMerged,
    prClosed,
    starred,
    forked,
  ] = await Promise.all([
    searchEventDates(token, `repo:${owner}/${name} is:issue created:>=${since}`, (n) => n.createdAt),
    searchEventDates(token, `repo:${owner}/${name} is:issue closed:>=${since}`, (n) => n.closedAt),
    searchEventDates(token, `repo:${owner}/${name} is:pr created:>=${since}`, (n) => n.createdAt),
    searchEventDates(token, `repo:${owner}/${name} is:pr is:merged merged:>=${since}`, (n) => n.mergedAt),
    searchEventDates(token, `repo:${owner}/${name} is:pr is:closed is:unmerged closed:>=${since}`, (n) => n.closedAt),
    starEventDates(token, owner, name, startMs),
    forkEventDates(token, owner, name, startMs),
  ]);

  // Each metric: current value minus reconstruction, only if its inputs fit.
  const metricSeries: Partial<Record<RepoMetric, (t: number) => number>> = {};
  if (!starred.capped) {
    metricSeries.stars = (t) => current.stars - after(starred.dates, t);
  }
  if (!forked.capped) {
    metricSeries.forks = (t) => current.forks - after(forked.dates, t);
  }
  if (!issueCreated.capped && !issueClosed.capped) {
    metricSeries.open_issues = (t) =>
      current.open_issues - after(issueCreated.dates, t) + after(issueClosed.dates, t);
  }
  if (!issueClosed.capped) {
    metricSeries.closed_issues = (t) =>
      current.closed_issues - after(issueClosed.dates, t);
  }
  if (!prCreated.capped && !prMerged.capped && !prClosed.capped) {
    metricSeries.open_prs = (t) =>
      current.open_prs -
      after(prCreated.dates, t) +
      after(prMerged.dates, t) +
      after(prClosed.dates, t);
  }
  if (!prMerged.capped) {
    metricSeries.merged_prs = (t) => current.merged_prs - after(prMerged.dates, t);
  }
  if (!prClosed.capped) {
    metricSeries.closed_prs = (t) => current.closed_prs - after(prClosed.dates, t);
  }

  const rows: { repoId: string; metric: string; date: Date; value: number }[] = [];
  // Days 1..90 ago (today's snapshot is written by linkRepo).
  for (let day = 1; day <= WINDOW_DAYS; day++) {
    const t = now - day * DAY_MS;
    const date = new Date(t);
    for (const [metric, at] of Object.entries(metricSeries)) {
      rows.push({ repoId, metric, date, value: Math.max(0, Math.round(at(t))) });
    }
  }

  if (rows.length > 0) {
    await prisma.snapshot.createMany({ data: rows });
  }

  // Mark the attempt so it isn't repeated, even if some metrics were skipped.
  await prisma.repo.update({
    where: { id: repoId },
    data: { backfilledAt: new Date() },
  });
}

/**
 * Re-runs backfill for every repo that has never been backfilled (e.g. repos
 * added before backfill existed). Idempotent: backfillRepo stamps backfilledAt,
 * so a repo is processed at most once.
 */
export async function backfillMissingRepos(): Promise<{
  processed: number;
  skipped: string[];
}> {
  const repos = await prisma.repo.findMany({
    where: { backfilledAt: null },
    select: { id: true, owner: true, name: true },
  });

  let processed = 0;
  const skipped: string[] = [];

  for (const repo of repos) {
    try {
      const token = await resolveTokenForRepo(repo.id);
      if (!token) {
        skipped.push(`${repo.owner}/${repo.name}: no usable token`);
        continue;
      }
      const data = await fetchRepoData(token, repo.owner, repo.name);
      if (!data) {
        skipped.push(`${repo.owner}/${repo.name}: not accessible`);
        continue;
      }
      await backfillRepo(token, repo.owner, repo.name, repo.id, data.metrics);
      processed++;
    } catch (error) {
      skipped.push(
        `${repo.owner}/${repo.name}: ${error instanceof Error ? error.message : "failed"}`,
      );
    }
  }

  return { processed, skipped };
}

/** A token from any user who tracks this repo, or null. */
async function resolveTokenForRepo(repoId: string): Promise<string | null> {
  const links = await prisma.dashboardRepo.findMany({
    where: { repoId },
    select: { dashboard: { select: { userId: true } } },
  });
  const userIds = [...new Set(links.map((link) => link.dashboard.userId))];
  for (const userId of userIds) {
    const token = await getGithubAccessToken(userId).catch(() => null);
    if (token) return token;
  }
  return null;
}

/** Count of event dates strictly after time `t`. */
function after(dates: number[], t: number): number {
  let count = 0;
  for (const date of dates) if (date > t) count++;
  return count;
}

const SEARCH_QUERY = /* GraphQL */ `
  query Backfill($q: String!, $cursor: String) {
    search(query: $q, type: ISSUE, first: ${PAGE_SIZE}, after: $cursor) {
      nodes {
        ... on Issue { createdAt closedAt }
        ... on PullRequest { createdAt closedAt mergedAt }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

type SearchNode = {
  createdAt?: string | null;
  closedAt?: string | null;
  mergedAt?: string | null;
};

type PageInfo = { hasNextPage: boolean; endCursor: string | null };

type SearchResponse = {
  search: {
    nodes: SearchNode[];
    pageInfo: PageInfo;
  };
};

type StargazersResponse = {
  repository: {
    stargazers: { edges: { starredAt: string }[]; pageInfo: PageInfo };
  } | null;
};

type ForksResponse = {
  repository: {
    forks: { nodes: { createdAt: string }[]; pageInfo: PageInfo };
  } | null;
};

async function searchEventDates(
  token: string,
  query: string,
  pick: (node: SearchNode) => string | null | undefined,
): Promise<EventDates> {
  const dates: number[] = [];
  let cursor: string | null = null;

  for (let page = 0; page < SEARCH_MAX_PAGES; page++) {
    const data: SearchResponse = await githubGraphql<SearchResponse>(
      token,
      SEARCH_QUERY,
      { q: query, cursor },
    );
    for (const node of data.search.nodes) {
      const raw = pick(node);
      if (raw) dates.push(Date.parse(raw));
    }
    if (!data.search.pageInfo.hasNextPage || !data.search.pageInfo.endCursor) {
      return { dates, capped: false };
    }
    cursor = data.search.pageInfo.endCursor;
  }
  return { dates, capped: true };
}

const STARGAZERS_QUERY = /* GraphQL */ `
  query Stargazers($owner: String!, $name: String!, $cursor: String) {
    repository(owner: $owner, name: $name) {
      stargazers(
        first: ${PAGE_SIZE}
        after: $cursor
        orderBy: { field: STARRED_AT, direction: DESC }
      ) {
        edges { starredAt }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`;

async function starEventDates(
  token: string,
  owner: string,
  name: string,
  startMs: number,
): Promise<EventDates> {
  const dates: number[] = [];
  let cursor: string | null = null;

  for (let page = 0; page < MAX_PAGES; page++) {
    const data: StargazersResponse = await githubGraphql<StargazersResponse>(
      token,
      STARGAZERS_QUERY,
      { owner, name, cursor },
    );

    const connection = data.repository?.stargazers;
    if (!connection) return { dates, capped: false };

    let reachedWindowEnd = false;
    for (const edge of connection.edges) {
      const ms = Date.parse(edge.starredAt);
      if (ms < startMs) {
        reachedWindowEnd = true;
        break;
      }
      dates.push(ms);
    }
    if (reachedWindowEnd || !connection.pageInfo.hasNextPage || !connection.pageInfo.endCursor) {
      return { dates, capped: false };
    }
    cursor = connection.pageInfo.endCursor;
  }
  return { dates, capped: true };
}

const FORKS_QUERY = /* GraphQL */ `
  query Forks($owner: String!, $name: String!, $cursor: String) {
    repository(owner: $owner, name: $name) {
      forks(
        first: ${PAGE_SIZE}
        after: $cursor
        orderBy: { field: CREATED_AT, direction: DESC }
      ) {
        nodes { createdAt }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`;

async function forkEventDates(
  token: string,
  owner: string,
  name: string,
  startMs: number,
): Promise<EventDates> {
  const dates: number[] = [];
  let cursor: string | null = null;

  for (let page = 0; page < MAX_PAGES; page++) {
    const data: ForksResponse = await githubGraphql<ForksResponse>(
      token,
      FORKS_QUERY,
      { owner, name, cursor },
    );

    const connection = data.repository?.forks;
    if (!connection) return { dates, capped: false };

    let reachedWindowEnd = false;
    for (const node of connection.nodes) {
      const ms = Date.parse(node.createdAt);
      if (ms < startMs) {
        reachedWindowEnd = true;
        break;
      }
      dates.push(ms);
    }
    if (reachedWindowEnd || !connection.pageInfo.hasNextPage || !connection.pageInfo.endCursor) {
      return { dates, capped: false };
    }
    cursor = connection.pageInfo.endCursor;
  }
  return { dates, capped: true };
}
