// Canonical metric list, dependency-free so both server and client can import it.
// Extend this (and the GitHub fetch query in lib/github/repo.ts) to add metrics.
export const REPO_METRICS = [
  "stars",
  "forks",
  "watchers",
  "open_issues",
  "closed_issues",
  "open_prs",
  "merged_prs",
  "closed_prs",
] as const;
export type RepoMetric = (typeof REPO_METRICS)[number];

export const METRIC_LABELS: Record<RepoMetric, string> = {
  stars: "Stars",
  forks: "Forks",
  watchers: "Watchers",
  open_issues: "Open issues",
  closed_issues: "Closed issues",
  open_prs: "Open PRs",
  merged_prs: "Merged PRs",
  closed_prs: "Closed PRs",
};
