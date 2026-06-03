"use client";

import { ViewDialog } from "@/app/_components/view-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card className="group w-80 gap-0 py-0">
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
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
            {config.datapoints.map((point, index) => (
              <li key={point.alias} className="flex items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: datapointColor(point, index) }}
                />
                <span className="truncate text-muted-foreground">
                  {datapointDisplayLabel(point, repos, config.showRepoInLabels)}
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
