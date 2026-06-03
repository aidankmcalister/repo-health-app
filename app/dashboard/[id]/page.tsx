import { DashboardActions } from "@/app/_components/dashboard-actions";
import { ViewCard } from "@/app/_components/view-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { getDashboardForUser } from "@/lib/queries";
import { getSession } from "@/lib/session";
import type { ViewConfig } from "@/lib/views";
import { CircleDot, GitBranch, Star } from "lucide-react";
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

  return (
    <main className="flex flex-col gap-8 p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{dashboard.name}</h1>
          {dashboard.description ? (
            <p className="mt-1 text-muted-foreground">{dashboard.description}</p>
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
        />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Views</h2>
        {dashboard.views.length === 0 ? (
          <p className="text-muted-foreground">No views yet. Add one above.</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {dashboard.views.map((view) => (
              <ViewCard
                key={view.id}
                view={{ id: view.id, config: view.config as unknown as ViewConfig }}
                dashboardId={dashboard.id}
                repos={repos.map(({ id, owner, name, stars, openIssues }) => ({
                  id,
                  owner,
                  name,
                  stars,
                  openIssues,
                }))}
              />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Repos</h2>
        {repos.length === 0 ? (
          <p className="text-muted-foreground">
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

type RepoCardProps = {
  repo: {
    owner: string;
    name: string;
    defaultBranch: string | null;
    stars: number | null;
    openIssues: number | null;
    lastSyncedAt: Date | null;
  };
};

function RepoCard({ repo }: RepoCardProps) {
  return (
    <a
      href={`https://github.com/${repo.owner}/${repo.name}`}
      target="_blank"
      rel="noreferrer"
      className="block w-72 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="gap-0 py-0 transition-colors hover:border-foreground/20">
        <CardContent className="flex flex-col gap-2 p-3">
        <div className="flex items-center gap-2">
          <Avatar className="size-6 rounded">
            <AvatarImage src={`https://github.com/${repo.owner}.png`} alt="" />
            <AvatarFallback className="rounded text-xs">
              {repo.owner.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-sm font-medium">
            {repo.owner}/{repo.name}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="size-3.5" />
            <span className="tabular-nums">{formatCount(repo.stars)}</span>
          </span>
          <span className="flex items-center gap-1">
            <CircleDot className="size-3.5" />
            <span className="tabular-nums">{formatCount(repo.openIssues)}</span>
          </span>
          {repo.defaultBranch ? (
            <span className="flex items-center gap-1">
              <GitBranch className="size-3.5" />
              <span className="truncate">{repo.defaultBranch}</span>
            </span>
          ) : null}
          <span>{syncedLabel(repo.lastSyncedAt)}</span>
        </div>
      </CardContent>
      </Card>
    </a>
  );
}

function formatCount(value: number | null): string {
  return value === null ? "—" : value.toLocaleString();
}

function syncedLabel(lastSyncedAt: Date | null): string {
  if (!lastSyncedAt) return "Not synced";
  const date = lastSyncedAt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  return `Synced ${date}`;
}
