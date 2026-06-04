"use client";

import { DashboardDialog } from "@/app/_components/dashboard-dialog";
import { SyncNowButton } from "@/app/_components/sync-now-button";
import { ViewDialog, type ViewRepo } from "@/app/_components/view-dialog";
import { Button } from "@/components/ui/button";
import type { HistoryPoint } from "@/lib/views";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";

type DashboardActionsProps = {
  dashboardId: string;
  dashboardName: string;
  dashboardDescription: string;
  highlightViewId: string | null;
  lastSyncedAt: number | null;
  views: { id: string; title: string }[];
  repos: ViewRepo[];
  history: HistoryPoint[];
};

/** Header controls for a dashboard: sync, edit (name + repos), and add a view. */
export function DashboardActions({
  dashboardId,
  dashboardName,
  dashboardDescription,
  highlightViewId,
  lastSyncedAt,
  views,
  repos,
  history,
}: DashboardActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [newViewOpen, setNewViewOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <SyncNowButton dashboardId={dashboardId} lastSyncedAt={lastSyncedAt} />
      <Button variant="outline" onClick={() => setEditOpen(true)}>
        <Pencil className="size-4" />
        Edit
      </Button>
      <Button onClick={() => setNewViewOpen(true)}>
        <Plus className="size-4" />
        New view
      </Button>

      <DashboardDialog
        mode="edit"
        dashboardId={dashboardId}
        initialName={dashboardName}
        initialDescription={dashboardDescription}
        initialHighlightViewId={highlightViewId}
        views={views}
        initialRepos={repos.map((repo) => ({
          owner: repo.owner,
          name: repo.name,
          nameWithOwner: `${repo.owner}/${repo.name}`,
        }))}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <ViewDialog
        dashboardId={dashboardId}
        repos={repos}
        history={history}
        open={newViewOpen}
        onOpenChange={setNewViewOpen}
      />
    </div>
  );
}
