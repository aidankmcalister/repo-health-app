import { DashboardActions } from "@/app/_components/dashboard-actions";
import { RepoSyncStatus } from "@/app/_components/repo-sync-status";
import { ViewCard } from "@/app/_components/view-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getDashboardForUser } from "@/lib/queries";
import { getSession } from "@/lib/session";
import type { ViewConfig } from "@/lib/views";
import { CircleDot, GitBranch, Globe, Star } from "lucide-react";
import { notFound, redirect } from "next/navigation";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/");
  }

  const { id } = await params;
  const dashboard = await getDashboardForUser(id, session.user.id);
  if (!dashboard) {
    notFound();
  }

  const repos = dashboard.repos.map(({ repo }) => repo);
  const history = repos.flatMap((repo) =>
    repo.snapshots.map((snapshot) => ({
      repoId: repo.id,
      metric: snapshot.metric,
      date: snapshot.date.getTime(),
      value: snapshot.value,
    })),
  );

  return (
    <main className="flex flex-col gap-10 p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-[-0.6px] text-foreground">
            {dashboard.name}
          </h1>
          {dashboard.description ? (
            <p className="mt-1.5 text-[14.5px] text-[var(--ink-subtle)]">
              {dashboard.description}
            </p>
          ) : null}
        </div>
        <DashboardActions
          dashboardId={dashboard.id}
          dashboardName={dashboard.name}
          dashboardDescription={dashboard.description ?? ""}
          highlightViewId={dashboard.highlightViewId}
          lastSyncedAt={dashboard.lastSyncedAt ? dashboard.lastSyncedAt.getTime() : null}
          views={dashboard.views.map((view) => ({
            id: view.id,
            title: (view.config as unknown as ViewConfig).title || "Untitled view",
          }))}
          repos={repos.map(({ id, owner, name, stars, openIssues }) => ({
            id,
            owner,
            name,
            stars,
            openIssues,
          }))}
          history={history}
        />
      </div>

      <section className="flex flex-col gap-4">
        <SectionHeader kicker="views" title="Views" />
        {dashboard.views.length === 0 ? (
          <p className="text-sm text-[var(--ink-subtle)]">
            No views yet. Add one above.
          </p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {dashboard.views.map((view) => (
              <ViewCard
                key={view.id}
                view={{
                  id: view.id,
                  type: view.type,
                  config: view.config as unknown as ViewConfig,
                }}
                dashboardId={dashboard.id}
                repos={repos.map(
                  ({ id, owner, name, stars, openIssues, backfillSkipped }) => ({
                    id,
                    owner,
                    name,
                    stars,
                    openIssues,
                    backfillSkipped,
                  }),
                )}
                history={history}
              />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader kicker="sources" title="Repos" />
        {repos.length === 0 ? (
          <p className="text-sm text-[var(--ink-subtle)]">
            No repos yet. Use Edit to add some.
          </p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {repos.map((repo) => (
              <RepoCard key={repo.id} repo={repo} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function SectionHeader({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[11px] tracking-[0.2px] text-primary">
        {kicker}
      </span>
      <h2 className="text-[17px] font-semibold tracking-[-0.3px] text-foreground">
        {title}
      </h2>
    </div>
  );
}

type RepoCardProps = {
  repo: {
    owner: string;
    name: string;
    defaultBranch: string | null;
    stars: number | null;
    openIssues: number | null;
    lastSyncedAt: Date | null;
    backfilledAt: Date | null;
  };
};

function RepoCard({ repo }: RepoCardProps) {
  return (
    <a
      href={`https://github.com/${repo.owner}/${repo.name}`}
      target="_blank"
      rel="noreferrer"
      className="block w-[280px] rounded-lg border border-[var(--hairline)] bg-[var(--surface-1)] px-4 py-[15px] transition-colors hover:border-[var(--hairline-strong)] hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-center gap-2.5">
        <Avatar className="size-[26px] rounded-[6px]">
          <AvatarImage src={`https://github.com/${repo.owner}.png`} alt="" />
          <AvatarFallback className="rounded-[6px] text-xs">
            {repo.owner.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="truncate font-mono text-[13px] text-foreground">
          {repo.owner}/{repo.name}
        </span>
        <Globe className="ml-auto size-3.5 shrink-0 text-[var(--ink-tertiary)]" />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-xs text-[var(--ink-subtle)]">
        <span className="flex items-center gap-1.5">
          <Star className="size-3.5 text-[var(--ink-tertiary)]" />
          <span className="tabular-nums">{formatCount(repo.stars)}</span>
        </span>
        <span className="text-[var(--ink-tertiary)]">·</span>
        <span className="flex items-center gap-1.5">
          <CircleDot className="size-3.5 text-[var(--ink-tertiary)]" />
          <span className="tabular-nums">{formatCount(repo.openIssues)}</span>
        </span>
        {repo.defaultBranch ? (
          <>
            <span className="text-[var(--ink-tertiary)]">·</span>
            <span className="flex items-center gap-1.5">
              <GitBranch className="size-3.5 text-[var(--ink-tertiary)]" />
              <span className="truncate">{repo.defaultBranch}</span>
            </span>
          </>
        ) : null}
        <RepoSyncStatus
          backfilledAt={repo.backfilledAt ? repo.backfilledAt.getTime() : null}
          lastSyncedAt={repo.lastSyncedAt ? repo.lastSyncedAt.getTime() : null}
        />
      </div>
    </a>
  );
}

function formatCount(value: number | null): string {
  return value === null ? "—" : value.toLocaleString();
}
