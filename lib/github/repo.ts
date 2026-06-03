import type { RepoMetric } from "@/lib/metrics";
import { githubGraphql } from "./client";

// Current public-facing data for one repo, keyed by the metrics we store.
export type RepoData = {
  nameWithOwner: string;
  owner: string;
  name: string;
  defaultBranch: string | null;
  metrics: Record<RepoMetric, number>;
};

type CountField = { totalCount: number };

type RepoDataResponse = {
  repository: {
    name: string;
    owner: { login: string };
    nameWithOwner: string;
    defaultBranchRef: { name: string } | null;
    stargazerCount: number;
    forkCount: number;
    watchers: CountField;
    openIssues: CountField;
    closedIssues: CountField;
    openPrs: CountField;
    mergedPrs: CountField;
    closedPrs: CountField;
  } | null;
};

const REPO_DATA_QUERY = /* GraphQL */ `
  query RepoData($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      name
      owner {
        login
      }
      nameWithOwner
      defaultBranchRef {
        name
      }
      stargazerCount
      forkCount
      watchers {
        totalCount
      }
      openIssues: issues(states: OPEN) {
        totalCount
      }
      closedIssues: issues(states: CLOSED) {
        totalCount
      }
      openPrs: pullRequests(states: OPEN) {
        totalCount
      }
      mergedPrs: pullRequests(states: MERGED) {
        totalCount
      }
      closedPrs: pullRequests(states: CLOSED) {
        totalCount
      }
    }
  }
`;

/**
 * Fetches a repo's current data with the given user token. Returns null when
 * the token can't see the repo (private / no access / missing), mirroring how
 * GitHub returns a null repository.
 */
export async function fetchRepoData(
  token: string,
  owner: string,
  name: string,
): Promise<RepoData | null> {
  const data = await githubGraphql<RepoDataResponse>(token, REPO_DATA_QUERY, {
    owner,
    name,
  });

  const repo = data.repository;
  if (!repo) {
    return null;
  }

  return {
    nameWithOwner: repo.nameWithOwner,
    owner: repo.owner.login,
    name: repo.name,
    defaultBranch: repo.defaultBranchRef?.name ?? null,
    metrics: {
      stars: repo.stargazerCount,
      forks: repo.forkCount,
      watchers: repo.watchers.totalCount,
      open_issues: repo.openIssues.totalCount,
      closed_issues: repo.closedIssues.totalCount,
      open_prs: repo.openPrs.totalCount,
      merged_prs: repo.mergedPrs.totalCount,
      closed_prs: repo.closedPrs.totalCount,
    },
  };
}
