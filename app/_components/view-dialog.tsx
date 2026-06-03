"use client";

import { createView, deleteView, updateView } from "@/app/actions/views";
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
import { Switch } from "@/components/ui/switch";
import { METRIC_LABELS, REPO_METRICS, type RepoMetric } from "@/lib/metrics";
import {
  ALIASES,
  computeViewValue,
  defaultShowLegend,
  formatViewValue,
  VIEW_TYPE_NUMBER,
  type ViewConfig,
  type ViewDatapoint,
} from "@/lib/views";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export type ViewRepo = {
  id: string;
  owner: string;
  name: string;
  stars: number | null;
  openIssues: number | null;
};

type ViewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dashboardId: string;
  repos: ViewRepo[];
} & (
  | { mode?: "create"; viewId?: never; initialConfig?: never }
  | { mode: "edit"; viewId: string; initialConfig: ViewConfig }
);

export function ViewDialog(props: ViewDialogProps) {
  const { open, onOpenChange, dashboardId, repos } = props;
  const isEdit = props.mode === "edit";
  const router = useRouter();

  const [title, setTitle] = useState(isEdit ? props.initialConfig.title : "");
  const [subtitle, setSubtitle] = useState(
    isEdit ? props.initialConfig.subtitle ?? "" : "",
  );
  const [datapoints, setDatapoints] = useState<ViewDatapoint[]>(
    isEdit ? props.initialConfig.datapoints : [],
  );
  const [formulaEnabled, setFormulaEnabled] = useState(
    isEdit ? props.initialConfig.formula !== null : false,
  );
  const [formula, setFormula] = useState(
    isEdit ? props.initialConfig.formula ?? "" : "",
  );
  const [prefix, setPrefix] = useState(
    isEdit ? props.initialConfig.prefix ?? "" : "",
  );
  const [postfix, setPostfix] = useState(
    isEdit ? props.initialConfig.postfix ?? "" : "",
  );
  const [showLegend, setShowLegend] = useState(
    isEdit
      ? props.initialConfig.showLegend ?? defaultShowLegend(VIEW_TYPE_NUMBER)
      : defaultShowLegend(VIEW_TYPE_NUMBER),
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  const canAddDatapoint = repos.length > 0 && datapoints.length < ALIASES.length;

  function handleDelete() {
    if (!isEdit) return;
    setError(null);
    startDelete(async () => {
      const result = await deleteView(props.viewId);
      if (result.ok) {
        onOpenChange(false);
        router.refresh();
      } else {
        setError(result.error ?? "Failed to delete view.");
      }
    });
  }

  const config: ViewConfig = {
    title,
    subtitle: subtitle.trim() ? subtitle : null,
    datapoints,
    formula: formulaEnabled ? formula : null,
    prefix: prefix.trim() ? prefix : null,
    postfix: postfix.trim() ? postfix : null,
    showLegend,
  };

  function addDatapoint() {
    const used = new Set(datapoints.map((point) => point.alias));
    const alias = ALIASES.find((letter) => !used.has(letter));
    if (!alias) return;
    setDatapoints([...datapoints, { alias, repoId: repos[0].id, metric: "stars" }]);
  }

  function updateDatapoint(alias: string, patch: Partial<ViewDatapoint>) {
    setDatapoints((current) =>
      current.map((point) =>
        point.alias === alias ? { ...point, ...patch } : point,
      ),
    );
  }

  function removeDatapoint(alias: string) {
    setDatapoints((current) => current.filter((point) => point.alias !== alias));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = isEdit
        ? await updateView(props.viewId, config)
        : await createView(dashboardId, config);
      if (result.ok) {
        onOpenChange(false);
        router.refresh();
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit view" : "New view"}</DialogTitle>
            <DialogDescription>
              Build a metric from this dashboard&apos;s repos.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 md:grid-cols-[1fr_300px]">
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="view-title">Title</Label>
                <Input
                  id="view-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Untitled view"
                  autoFocus
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="view-subtitle">Subtitle (optional)</Label>
                <Input
                  id="view-subtitle"
                  value={subtitle}
                  onChange={(event) => setSubtitle(event.target.value)}
                  placeholder="Add a subtitle"
                />
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <div className="grid gap-2">
                  <Label>Visualization</Label>
                  <Select value="number">
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="number">Big Number</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="view-prefix">Prefix</Label>
                  <Input
                    id="view-prefix"
                    value={prefix}
                    onChange={(event) => setPrefix(event.target.value)}
                    placeholder="$"
                    className="w-24"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="view-postfix">Postfix</Label>
                  <Input
                    id="view-postfix"
                    value={postfix}
                    onChange={(event) => setPostfix(event.target.value)}
                    placeholder="%"
                    className="w-24"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Data points</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addDatapoint}
                    disabled={!canAddDatapoint}
                  >
                    Add data point
                  </Button>
                </div>

                {repos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Add repos to this dashboard first.
                  </p>
                ) : datapoints.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data points yet.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {datapoints.map((point) => (
                      <li key={point.alias} className="flex items-center gap-2">
                        <span className="w-6 text-center font-mono font-medium">
                          {point.alias}
                        </span>
                        <Select
                          value={point.repoId}
                          onValueChange={(repoId) =>
                            updateDatapoint(point.alias, { repoId })
                          }
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {repos.map((repo) => (
                              <SelectItem key={repo.id} value={repo.id}>
                                {repo.owner}/{repo.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={point.metric}
                          onValueChange={(metric) =>
                            updateDatapoint(point.alias, {
                              metric: metric as RepoMetric,
                            })
                          }
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {REPO_METRICS.map((metric) => (
                              <SelectItem key={metric} value={metric}>
                                {METRIC_LABELS[metric]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDatapoint(point.alias)}
                        >
                          <Trash2 className="size-4" />
                          <span className="sr-only">Remove {point.alias}</span>
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Switch
                    id="formula-toggle"
                    checked={formulaEnabled}
                    onCheckedChange={setFormulaEnabled}
                  />
                  <Label htmlFor="formula-toggle">Formula</Label>
                </div>
                {formulaEnabled ? (
                  <>
                    <Input
                      value={formula}
                      onChange={(event) => setFormula(event.target.value)}
                      placeholder="A / B * 100"
                      className="font-mono"
                    />
                    <p className="text-sm text-muted-foreground">
                      Reference data points by their letter, e.g. A / B * 100.
                    </p>
                  </>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="legend-toggle"
                  checked={showLegend}
                  onCheckedChange={setShowLegend}
                />
                <Label htmlFor="legend-toggle">Show legend</Label>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Preview</Label>
              <ViewPreview config={config} repos={repos} />
            </div>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter className={isEdit ? "sm:justify-between" : undefined}>
            {isEdit ? (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting…" : "Delete view"}
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

function ViewPreview({
  config,
  repos,
}: {
  config: ViewConfig;
  repos: ViewRepo[];
}) {
  function metricFor(repoId: string, metric: RepoMetric): number | null {
    const repo = repos.find((r) => r.id === repoId);
    if (!repo) return null;
    return metric === "stars" ? repo.stars : repo.openIssues;
  }

  function repoLabel(repoId: string): string {
    const repo = repos.find((r) => r.id === repoId);
    return repo ? `${repo.owner}/${repo.name}` : "unknown repo";
  }

  const value = formatViewValue(computeViewValue(config, metricFor), config);

  return (
    <div className="rounded-xl border p-4">
      <p className="truncate font-semibold leading-tight">
        {config.title || "Untitled view"}
      </p>
      {config.subtitle ? (
        <p className="truncate text-xs text-muted-foreground">
          {config.subtitle}
        </p>
      ) : null}

      <p className="mt-2 text-4xl font-bold tabular-nums">{value}</p>

      {config.showLegend && config.datapoints.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-1 text-sm">
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
    </div>
  );
}
