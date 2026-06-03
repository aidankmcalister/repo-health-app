// Canonical metric list, dependency-free so both server and client can import it.
// Extend this (and the GitHub fetch query) to capture more metrics later.
export const REPO_METRICS = ["stars", "open_issues"] as const;
export type RepoMetric = (typeof REPO_METRICS)[number];

export const METRIC_LABELS: Record<RepoMetric, string> = {
  stars: "Stars",
  open_issues: "Open issues",
};
