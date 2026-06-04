"use client";

import {
  RepoMultiSelect,
  type SelectedRepo,
} from "@/app/_components/repo-multi-select";
import {
  createDashboardWithRepos,
  deleteDashboard,
  updateDashboard,
} from "@/app/actions/dashboards";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

const NO_HIGHLIGHT = "none";

type ViewOption = { id: string; title: string };

type DashboardDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
} & (
  | {
      mode: "create";
      dashboardId?: never;
      initialName?: never;
      initialDescription?: never;
      initialHighlightViewId?: never;
      initialRepos?: never;
      views?: never;
    }
  | {
      mode: "edit";
      dashboardId: string;
      initialName: string;
      initialDescription: string;
      initialHighlightViewId: string | null;
      initialRepos: SelectedRepo[];
      views: ViewOption[];
    }
);

/** Define a dashboard: pick a name and toggle which repos belong to it. */
export function DashboardDialog(props: DashboardDialogProps) {
  const { open, onOpenChange, mode } = props;
  const router = useRouter();
  const [name, setName] = useState(props.mode === "edit" ? props.initialName : "");
  const [description, setDescription] = useState(
    props.mode === "edit" ? props.initialDescription : "",
  );
  const [highlightViewId, setHighlightViewId] = useState(
    props.mode === "edit"
      ? props.initialHighlightViewId ?? NO_HIGHLIGHT
      : NO_HIGHLIGHT,
  );
  const [repos, setRepos] = useState<SelectedRepo[]>(
    props.mode === "edit" ? props.initialRepos : [],
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  function handleDelete() {
    if (props.mode !== "edit") return;
    setError(null);
    startDelete(async () => {
      const result = await deleteDashboard(props.dashboardId);
      if (result.ok) {
        onOpenChange(false);
        router.push("/");
        toast.success("Dashboard deleted");
      } else {
        setError(result.error ?? "Failed to delete dashboard.");
      }
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const refs = repos.map(({ owner, name }) => ({ owner, name }));
      const highlight =
        highlightViewId === NO_HIGHLIGHT ? null : highlightViewId;
      const result =
        props.mode === "edit"
          ? await updateDashboard(
              props.dashboardId,
              name,
              description,
              highlight,
              refs,
            )
          : await createDashboardWithRepos(name, description, refs);

      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
        return;
      }

      if (result.failed && result.failed.length > 0) {
        setError(`Saved, but couldn't add: ${result.failed.join(", ")}.`);
        return;
      }

      onOpenChange(false);
      toast.success(mode === "edit" ? "Dashboard updated" : "Dashboard created");
      if (props.mode === "create" && result.dashboardId) {
        router.push(`/dashboard/${result.dashboardId}`);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>
              {mode === "edit" ? "Edit dashboard" : "New dashboard"}
            </DialogTitle>
            <DialogDescription>
              Name your dashboard and choose the repos to watch.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor="dashboard-name">Name</Label>
            <Input
              id="dashboard-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="My dashboard"
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dashboard-description">Description (optional)</Label>
            <Textarea
              id="dashboard-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What is this dashboard for?"
              rows={2}
            />
          </div>

          {props.mode === "edit" && props.views.length > 0 ? (
            <div className="grid gap-2">
              <Label htmlFor="highlight-view">Highlight view</Label>
              <Select value={highlightViewId} onValueChange={setHighlightViewId}>
                <SelectTrigger id="highlight-view" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_HIGHLIGHT}>None</SelectItem>
                  {props.views.map((view) => (
                    <SelectItem key={view.id} value={view.id}>
                      {view.title || "Untitled view"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Shown on the home page card for this dashboard.
              </p>
            </div>
          ) : null}

          <div className="grid gap-2">
            <Label>Repos</Label>
            <RepoMultiSelect selected={repos} onChange={setRepos} />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter className={mode === "edit" ? "sm:justify-between" : undefined}>
            {mode === "edit" ? (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting…" : "Delete dashboard"}
              </Button>
            ) : null}
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
