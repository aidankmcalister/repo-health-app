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

type RepoDataResponse = {
  repository: {
    name: string;
    owner: { login: string };
    nameWithOwner: string;
    defaultBranchRef: { name: string } | null;
    stargazerCount: number;
    issues: { totalCount: number };
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
      issues(states: OPEN) {
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
      open_issues: repo.issues.totalCount,
    },
  };
}
