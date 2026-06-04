/**
 * Backfill verification: invariants (cheap) + GitHub ground truth (gold standard).
 * Run: bunx tsx --env-file=.env scripts/verify-backfill.ts
 *
 * - Cumulative metrics (stars, forks, closed issues/PRs, merged PRs) only rise.
 * - Each reconstructed metric should span ~90 days.
 * - Ground truth compares our stored value ~45 days ago to GitHub's authoritative
 *   `search { issueCount }` for closed_issues / open_issues / merged_prs.
 *   Small deltas are expected (daily granularity vs GitHub's date-only counts).
 */
import prisma from "@/app/lib/prisma";

const CUMULATIVE = new Set([
  "stars",
  "forks",
  "closed_issues",
  "merged_prs",
  "closed_prs",
]);
const DAY = 86_400_000;

async function getToken(): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { providerId: "github" },
    select: { accessToken: true },
  });
  return account?.accessToken ?? null;
}

async function searchCount(token: string, q: string): Promise<number> {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "tendril",
    },
    body: JSON.stringify({
      query: `query($q:String!){ search(query:$q,type:ISSUE){ issueCount } }`,
      variables: { q },
    }),
  });
  const json = await res.json();
  return json.data?.search?.issueCount ?? -1;
}

async function main() {
  const token = await getToken();
  const repos = await prisma.repo.findMany({
    select: { id: true, owner: true, name: true, backfilledAt: true, backfillSkipped: true },
  });

  for (const repo of repos) {
    console.log(`\n=== ${repo.owner}/${repo.name} ===`);
    console.log(
      `backfilledAt=${repo.backfilledAt?.toISOString().slice(0, 10) ?? "null"}  skipped=[${repo.backfillSkipped.join(", ")}]`,
    );

    const snaps = await prisma.snapshot.findMany({
      where: { repoId: repo.id },
      orderBy: { date: "asc" },
      select: { metric: true, date: true, value: true },
    });
    const byMetric = new Map<string, { date: number; value: number }[]>();
    for (const s of snaps) {
      const list = byMetric.get(s.metric) ?? [];
      list.push({ date: s.date.getTime(), value: s.value });
      byMetric.set(s.metric, list);
    }

    for (const [metric, pts] of [...byMetric].sort()) {
      let monotonic = true;
      if (CUMULATIVE.has(metric)) {
        for (let i = 1; i < pts.length; i++) {
          if (pts[i].value < pts[i - 1].value) monotonic = false;
        }
      }
      const first = pts[0];
      const last = pts[pts.length - 1];
      const spanDays = Math.round((last.date - first.date) / DAY);
      const mono = CUMULATIVE.has(metric) ? `  monotonic=${monotonic ? "OK" : "FAIL"}` : "";
      console.log(
        `  ${metric.padEnd(14)} n=${String(pts.length).padStart(3)} span=${spanDays}d  first=${first.value} last=${last.value}${mono}`,
      );
    }

    if (token && repo.backfilledAt) {
      const cutoff = Date.now() - 45 * DAY;
      const ymd = new Date(cutoff).toISOString().slice(0, 10);
      const ourAt = (m: string) =>
        (byMetric.get(m) ?? []).filter((p) => p.date <= cutoff).pop()?.value ?? null;
      const base = `repo:${repo.owner}/${repo.name}`;
      const ghClosedIssues = await searchCount(token, `${base} is:issue is:closed closed:<=${ymd}`);
      const ghCreatedIssues = await searchCount(token, `${base} is:issue created:<=${ymd}`);
      const ghMerged = await searchCount(token, `${base} is:pr is:merged merged:<=${ymd}`);
      console.log(`  GROUND TRUTH @ ${ymd}:`);
      console.log(`    closed_issues: ours=${ourAt("closed_issues")} github=${ghClosedIssues}`);
      console.log(`    open_issues:   ours=${ourAt("open_issues")} github=${ghCreatedIssues - ghClosedIssues}`);
      console.log(`    merged_prs:    ours=${ourAt("merged_prs")} github=${ghMerged}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
