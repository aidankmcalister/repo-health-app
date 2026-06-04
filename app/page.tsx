import { NewDashboard } from "@/app/_components/new-dashboard";
import { SignInButton } from "@/app/_components/sign-in-button";
import { Visualization } from "@/components/visualizations";
import { getDashboardsForUser } from "@/lib/queries";
import { getSession } from "@/lib/session";
import { buildViewData, type ViewConfig, type ViewData } from "@/lib/views";
import { ArrowRight, Sprout } from "lucide-react";
import Link from "next/link";

type Dashboard = Awaited<ReturnType<typeof getDashboardsForUser>>[number];

export default async function Home() {
  const session = await getSession();

  if (!session?.user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--canvas)] p-8 text-center">
        <span className="flex size-14 items-center justify-center rounded-xl border border-[color-mix(in_srgb,var(--primary)_34%,transparent)] bg-[color-mix(in_srgb,var(--primary)_16%,var(--surface-1))] text-primary">
          <Sprout className="size-7" />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-[-0.8px] text-foreground">
            Tendril
          </h1>
          <p className="max-w-sm text-[var(--ink-subtle)]">
            Watch your GitHub repos — pull requests, issues, stars, and
            contributor health. Sign in to get started.
          </p>
        </div>
        <SignInButton />
      </main>
    );
  }

  const dashboards = await getDashboardsForUser(session.user.id);

  return (
    <main className="flex flex-col gap-7 p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="font-mono text-[11px] tracking-[0.2px] text-primary">
            overview
          </span>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.6px] text-foreground">
            Dashboards
          </h1>
          <p className="mt-1.5 text-[14.5px] text-[var(--ink-subtle)]">
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
      className="group flex h-full flex-col gap-3 rounded-lg border border-[var(--hairline)] bg-[var(--surface-1)] p-5 transition-colors hover:border-[var(--hairline-strong)] hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div>
        <p className="truncate text-base font-semibold tracking-[-0.2px] text-foreground">
          {dashboard.name}
        </p>
        {dashboard.description ? (
          <p className="mt-0.5 line-clamp-1 text-sm text-[var(--ink-subtle)]">
            {dashboard.description}
          </p>
        ) : null}
      </div>

      <p className="font-mono text-xs text-[var(--ink-subtle)]">
        {repoCount} {repoCount === 1 ? "repo" : "repos"} · {viewCount}{" "}
        {viewCount === 1 ? "view" : "views"}
      </p>

      <div className="flex flex-1 flex-col justify-center py-2">
        {highlight ? (
          <>
            <Visualization
              type={highlight.type}
              config={highlight.config}
              data={highlight.data}
            />
            <p className="mt-1.5 truncate font-mono text-[11px] text-[var(--ink-subtle)]">
              {highlight.title}
            </p>
          </>
        ) : (
          <p className="text-sm text-[var(--ink-tertiary)]">
            No highlight view yet.
          </p>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-[var(--hairline)] pt-3 font-mono text-xs text-[var(--ink-subtle)]">
        <span>{synced}</span>
        <ArrowRight className="size-4 text-[var(--ink-tertiary)] transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>
    </Link>
  );
}

function highlightFor(dashboard: Dashboard): {
  type: string;
  title: string;
  config: ViewConfig;
  data: ViewData;
} | null {
  if (!dashboard.highlightViewId) return null;
  const view = dashboard.views.find((v) => v.id === dashboard.highlightViewId);
  if (!view) return null;

  const config = view.config as unknown as ViewConfig;
  const repos = dashboard.repos.map(({ repo }) => ({
    id: repo.id,
    owner: repo.owner,
    name: repo.name,
    stars: repo.stars,
    openIssues: repo.openIssues,
    backfillSkipped: repo.backfillSkipped,
  }));
  const history = dashboard.repos.flatMap(({ repo }) =>
    repo.snapshots.map((snapshot) => ({
      repoId: repo.id,
      metric: snapshot.metric,
      date: snapshot.date.getTime(),
      value: snapshot.value,
    })),
  );

  return {
    type: view.type,
    title: config.title || "Untitled view",
    config,
    data: buildViewData(config, repos, history),
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
