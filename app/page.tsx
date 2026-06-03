import { NewDashboard } from "@/app/_components/new-dashboard";
import { SignInButton } from "@/app/_components/sign-in-button";
import { Card, CardContent } from "@/components/ui/card";
import { getDashboardsForUser } from "@/lib/queries";
import { getSession } from "@/lib/session";
import { type RepoMetric } from "@/lib/metrics";
import { computeViewValue, formatViewValue, type ViewConfig } from "@/lib/views";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

type Dashboard = Awaited<ReturnType<typeof getDashboardsForUser>>[number];

export default async function Home() {
  const session = await getSession();

  if (!session?.user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
        <h1 className="text-2xl font-bold tracking-tight">Tendril</h1>
        <p className="text-muted-foreground">
          Watch your GitHub repos. Sign in to get started.
        </p>
        <SignInButton />
      </main>
    );
  }

  const dashboards = await getDashboardsForUser(session.user.id);

  return (
    <main className="flex flex-col gap-6 p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboards</h1>
          <p className="mt-1 text-muted-foreground">
            Group your repos and build views over their activity.
          </p>
        </div>
        <NewDashboard variant="button" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {dashboards.map((dashboard) => (
          <DashboardSummaryCard key={dashboard.id} dashboard={dashboard} />
        ))}
        <NewDashboard variant="card" />
      </div>
    </main>
  );
}

function DashboardSummaryCard({ dashboard }: { dashboard: Dashboard }) {
  const repoCount = dashboard.repos.length;
  const viewCount = dashboard.views.length;
  const highlight = highlightFor(dashboard);
  const synced = syncedAgo(
    dashboard.repos.map(({ repo }) => repo.lastSyncedAt),
  );

  return (
    <Link
      href={`/dashboard/${dashboard.id}`}
      className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="h-full gap-0 py-0 transition-colors hover:border-foreground/20">
        <CardContent className="flex h-full flex-col gap-3 p-5">
          <div>
            <p className="truncate text-lg font-semibold leading-tight">
              {dashboard.name}
            </p>
            {dashboard.description ? (
              <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                {dashboard.description}
              </p>
            ) : null}
          </div>

          <p className="font-mono text-xs text-muted-foreground">
            {repoCount} {repoCount === 1 ? "repo" : "repos"} · {viewCount}{" "}
            {viewCount === 1 ? "view" : "views"}
          </p>

          <div className="flex flex-1 flex-col justify-center py-2">
            {highlight ? (
              <>
                <p className="text-3xl font-bold tabular-nums">
                  {highlight.value}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {highlight.title}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No highlight view yet.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between border-t pt-3 font-mono text-xs text-muted-foreground">
            <span>{synced}</span>
            <ArrowRight className="size-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function highlightFor(
  dashboard: Dashboard,
): { title: string; value: string } | null {
  if (!dashboard.highlightViewId) return null;
  const view = dashboard.views.find((v) => v.id === dashboard.highlightViewId);
  if (!view) return null;

  const config = view.config as unknown as ViewConfig;
  const metrics = new Map(
    dashboard.repos.map(({ repo }) => [
      repo.id,
      { stars: repo.stars, openIssues: repo.openIssues },
    ]),
  );
  const resolve = (repoId: string, metric: RepoMetric): number | null => {
    const entry = metrics.get(repoId);
    if (!entry) return null;
    return metric === "stars" ? entry.stars : entry.openIssues;
  };

  return {
    title: config.title || "Untitled view",
    value: formatViewValue(computeViewValue(config, resolve), config),
  };
}

function syncedAgo(dates: (Date | null)[]): string {
  const valid = dates.filter((date): date is Date => date !== null);
  if (valid.length === 0) return "not synced";

  const latest = valid.reduce((a, b) => (a > b ? a : b));
  const minutes = Math.floor((Date.now() - latest.getTime()) / 60000);
  if (minutes < 1) return "synced just now";
  if (minutes < 60) return `synced ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `synced ${hours}h ago`;
  return `synced ${Math.floor(hours / 24)}d ago`;
}
