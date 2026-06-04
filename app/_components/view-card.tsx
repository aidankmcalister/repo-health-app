"use client";

import { ViewDialog } from "@/app/_components/view-dialog";
import { Button } from "@/components/ui/button";
import { Visualization } from "@/components/visualizations";
import {
  buildViewData,
  datapointColor,
  datapointDisplayLabel,
  type HistoryPoint,
  type ViewConfig,
} from "@/lib/views";
import { Pencil } from "lucide-react";
import { useState } from "react";

type ViewCardRepo = {
  id: string;
  owner: string;
  name: string;
  stars: number | null;
  openIssues: number | null;
  backfillSkipped: string[];
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

  return (
    <div className="group relative z-0 flex w-80 flex-col gap-3 rounded-lg border border-[var(--hairline)] bg-[var(--surface-1)] px-5 py-[18px] hover:z-20">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium leading-tight text-foreground">
            {config.title || "Untitled view"}
          </p>
          {config.subtitle ? (
            <p className="mt-1 truncate font-mono text-[11.5px] text-[var(--ink-subtle)]">
              {config.subtitle}
            </p>
          ) : null}
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setEditOpen(true)}
          className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        >
          <Pencil className="size-4" />
          <span className="sr-only">Edit view</span>
        </Button>
      </div>

      <Visualization type={type} config={config} data={data} />

      {config.showLegend ? (
        <ul className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
          {config.datapoints.map((point, index) => (
            <li
              key={point.alias}
              className="flex items-center gap-2 font-mono text-[11px] text-[var(--ink-subtle)]"
            >
              <span
                className="h-0.5 w-4 shrink-0 rounded-full"
                style={{ backgroundColor: datapointColor(point, index) }}
              />
              <span className="truncate">
                {datapointDisplayLabel(point, repos, config.showRepoInLabels)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

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
    </div>
  );
}
