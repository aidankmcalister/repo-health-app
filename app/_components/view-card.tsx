"use client";

import { ViewDialog } from "@/app/_components/view-dialog";
import { Button } from "@/components/ui/button";
import { Visualization } from "@/components/visualizations";
import { ChangePill } from "@/components/visualizations/change-pill";
import { ViewLegend } from "@/components/visualizations/view-legend";
import { cn } from "@/lib/utils";
import {
  buildViewData,
  VIEW_TYPE_NUMBER,
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
    <div
      className={cn(
        "group relative z-0 flex w-80 flex-col gap-3 rounded-lg border border-[var(--hairline)] bg-[var(--surface-1)] px-5 py-[18px] hover:z-20",
        // Clip the Big Number sparkline to the rounded corners. Charts keep
        // overflow visible so their hover tooltip isn't cut off.
        type === VIEW_TYPE_NUMBER && "overflow-hidden",
      )}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 flex-1 truncate text-sm font-medium leading-tight text-foreground">
            {config.title || "Untitled view"}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            {config.compare && data.delta !== null ? (
              <ChangePill value={data.delta} />
            ) : null}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setEditOpen(true)}
              className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            >
              <Pencil className="size-4" />
              <span className="sr-only">Edit view</span>
            </Button>
          </div>
        </div>
        {config.subtitle ? (
          <p className="font-mono text-[11.5px] break-words text-[var(--ink-subtle)]">
            {config.subtitle}
          </p>
        ) : null}
      </div>

      <Visualization type={type} config={config} data={data} />

      <ViewLegend config={config} repos={repos} />

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
