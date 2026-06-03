"use client";

import { ViewDialog } from "@/app/_components/view-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Visualization } from "@/components/visualizations";
import { METRIC_LABELS } from "@/lib/metrics";
import { buildViewData, type HistoryPoint, type ViewConfig } from "@/lib/views";
import { Pencil } from "lucide-react";
import { useState } from "react";

type ViewCardRepo = {
  id: string;
  owner: string;
  name: string;
  stars: number | null;
  openIssues: number | null;
};

type ViewCardProps = {
  view: { id: string; type: string; config: ViewConfig };
  dashboardId: string;
  repos: ViewCardRepo[];
  history: HistoryPoint[];
};

export function ViewCard({ view, dashboardId, repos, history }: ViewCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const { config, type } = view;
  const data = buildViewData(config, repos, history);

  function repoLabel(repoId: string): string {
    const repo = repos.find((r) => r.id === repoId);
    return repo ? `${repo.owner}/${repo.name}` : "unknown repo";
  }

  return (
    <Card className="group w-80 gap-0 py-0">
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold leading-tight">
              {config.title || "Untitled view"}
            </p>
            {config.subtitle ? (
              <p className="truncate text-xs text-muted-foreground">
                {config.subtitle}
              </p>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditOpen(true)}
            className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          >
            <Pencil className="size-4" />
            <span className="sr-only">Edit view</span>
          </Button>
        </div>

        <Visualization type={type} config={config} data={data} />

        {config.showLegend ? (
          <ul className="flex flex-col gap-1 text-sm">
            {config.datapoints.map((point) => (
              <li key={point.alias} className="flex items-center gap-2">
                <span className="font-mono font-medium">{point.alias}</span>
                <span className="truncate text-muted-foreground">
                  {repoLabel(point.repoId)} · {METRIC_LABELS[point.metric]}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>

      <ViewDialog
        mode="edit"
        viewId={view.id}
        initialType={type}
        initialConfig={config}
        dashboardId={dashboardId}
        repos={repos}
        history={history}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </Card>
  );
}
