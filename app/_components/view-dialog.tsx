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
import { Visualization } from "@/components/visualizations";
import { METRIC_LABELS, REPO_METRICS, type RepoMetric } from "@/lib/metrics";
import {
  ALIASES,
  buildViewData,
  datapointColor,
  datapointDisplayLabel,
  defaultShowLegend,
  VIEW_COLORS,
  VIEW_TYPE_NUMBER,
  VIEW_TYPES,
  type HistoryPoint,
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
  history: HistoryPoint[];
} & (
  | {
      mode?: "create";
      viewId?: never;
      initialType?: never;
      initialConfig?: never;
    }
  | {
      mode: "edit";
      viewId: string;
      initialType: string;
      initialConfig: ViewConfig;
    }
);

export function ViewDialog(props: ViewDialogProps) {
  const { open, onOpenChange, dashboardId, repos, history } = props;
  const isEdit = props.mode === "edit";
  const router = useRouter();

  const [type, setType] = useState(
    isEdit ? props.initialType : VIEW_TYPE_NUMBER,
  );
  const [title, setTitle] = useState(isEdit ? props.initialConfig.title : "");
  const [subtitle, setSubtitle] = useState(
    isEdit ? (props.initialConfig.subtitle ?? "") : "",
  );
  const [datapoints, setDatapoints] = useState<ViewDatapoint[]>(
    isEdit ? props.initialConfig.datapoints : [],
  );
  const [formulaEnabled, setFormulaEnabled] = useState(
    isEdit ? props.initialConfig.formula !== null : false,
  );
  const [formula, setFormula] = useState(
    isEdit ? (props.initialConfig.formula ?? "") : "",
  );
  const [prefix, setPrefix] = useState(
    isEdit ? (props.initialConfig.prefix ?? "") : "",
  );
  const [postfix, setPostfix] = useState(
    isEdit ? (props.initialConfig.postfix ?? "") : "",
  );
  const [showLegend, setShowLegend] = useState(
    isEdit
      ? (props.initialConfig.showLegend ?? defaultShowLegend(VIEW_TYPE_NUMBER))
      : defaultShowLegend(VIEW_TYPE_NUMBER),
  );
  const [showRepoInLabels, setShowRepoInLabels] = useState(
    isEdit ? (props.initialConfig.showRepoInLabels ?? false) : false,
  );
  const [yDecimals, setYDecimals] = useState(
    isEdit && props.initialConfig.yAxis?.decimals != null
      ? String(props.initialConfig.yAxis.decimals)
      : "auto",
  );
  const [yPrefix, setYPrefix] = useState(
    isEdit ? (props.initialConfig.yAxis?.prefix ?? "") : "",
  );
  const [yPostfix, setYPostfix] = useState(
    isEdit ? (props.initialConfig.yAxis?.postfix ?? "") : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  const canAddDatapoint =
    repos.length > 0 && datapoints.length < ALIASES.length;

  const config: ViewConfig = {
    title,
    subtitle: subtitle.trim() ? subtitle : null,
    datapoints,
    formula: formulaEnabled ? formula : null,
    prefix: prefix.trim() ? prefix : null,
    postfix: postfix.trim() ? postfix : null,
    showLegend,
    showRepoInLabels,
    yAxis: {
      decimals: yDecimals === "auto" ? null : Number(yDecimals),
      prefix: yPrefix.trim() ? yPrefix : null,
      postfix: yPostfix.trim() ? yPostfix : null,
    },
  };

  function changeType(next: string) {
    setType(next);
    setShowLegend(defaultShowLegend(next));
  }

  function addDatapoint() {
    const used = new Set(datapoints.map((point) => point.alias));
    const alias = ALIASES.find((letter) => !used.has(letter));
    if (!alias) return;
    setDatapoints([
      ...datapoints,
      {
        alias,
        repoId: repos[0].id,
        metric: "stars",
        color: VIEW_COLORS[datapoints.length % VIEW_COLORS.length].value,
      },
    ]);
  }

  function updateDatapoint(alias: string, patch: Partial<ViewDatapoint>) {
    setDatapoints((current) =>
      current.map((point) =>
        point.alias === alias ? { ...point, ...patch } : point,
      ),
    );
  }

  function removeDatapoint(alias: string) {
    setDatapoints((current) =>
      current.filter((point) => point.alias !== alias),
    );
  }

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

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = isEdit
        ? await updateView(props.viewId, type, config)
        : await createView(dashboardId, type, config);
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
      <DialogContent className="sm:max-w-7xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit view" : "New view"}</DialogTitle>
            <DialogDescription>
              Build a metric from this dashboard&apos;s repos.
            </DialogDescription>
          </DialogHeader>

          <div className="grid items-start w-fit gap-6 md:grid-cols-[1fr_340px]">
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
                  <Select value={type} onValueChange={changeType}>
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VIEW_TYPES.map((entry) => (
                        <SelectItem key={entry.type} value={entry.type}>
                          {entry.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {type === VIEW_TYPE_NUMBER ? (
                  <>
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
                  </>
                ) : null}
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
                  <p className="text-sm text-muted-foreground">
                    No data points yet.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {datapoints.map((point, index) => (
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
                          <SelectTrigger className="w-36">
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
                        <Select
                          value={point.color ?? datapointColor(point, index)}
                          onValueChange={(color) =>
                            updateDatapoint(point.alias, { color })
                          }
                        >
                          <SelectTrigger className="w-16">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="min-w-0">
                            {VIEW_COLORS.map((c) => (
                              <SelectItem
                                key={c.value}
                                value={c.value}
                                textValue={c.label}
                              >
                                <span
                                  className="size-3 rounded-full"
                                  style={{ backgroundColor: c.value }}
                                />
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
            </div>

            <div className="flex flex-col gap-4 w-xl md:border-l md:pl-6">
              <div className="flex flex-col gap-2">
                <Label>Preview</Label>
                <ViewPreview
                  type={type}
                  config={config}
                  repos={repos}
                  history={history}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="legend-toggle"
                  checked={showLegend}
                  onCheckedChange={setShowLegend}
                />
                <Label htmlFor="legend-toggle">Show legend</Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="repo-label-toggle"
                  checked={showRepoInLabels}
                  onCheckedChange={setShowRepoInLabels}
                />
                <Label htmlFor="repo-label-toggle">Show repo in labels</Label>
              </div>

              {type !== VIEW_TYPE_NUMBER ? (
                <div className="grid gap-2">
                  <Label>Y-axis labels</Label>
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="grid gap-1">
                      <span className="text-xs text-muted-foreground">
                        Decimals
                      </span>
                      <Select value={yDecimals} onValueChange={setYDecimals}>
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Auto</SelectItem>
                          <SelectItem value="0">0</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1">
                      <span className="text-xs text-muted-foreground">
                        Prefix
                      </span>
                      <Input
                        value={yPrefix}
                        onChange={(event) => setYPrefix(event.target.value)}
                        placeholder="$"
                        className="w-24"
                      />
                    </div>
                    <div className="grid gap-1">
                      <span className="text-xs text-muted-foreground">
                        Postfix
                      </span>
                      <Input
                        value={yPostfix}
                        onChange={(event) => setYPostfix(event.target.value)}
                        placeholder="%"
                        className="w-24"
                      />
                    </div>
                  </div>
                </div>
              ) : null}
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
  type,
  config,
  repos,
  history,
}: {
  type: string;
  config: ViewConfig;
  repos: ViewRepo[];
  history: HistoryPoint[];
}) {
  const data = buildViewData(config, repos, history);

  return (
    <div className="flex flex-col gap-3 rounded-xl border p-4">
      <div>
        <p className="truncate font-semibold leading-tight">
          {config.title || "Untitled view"}
        </p>
        {config.subtitle ? (
          <p className="truncate text-xs text-muted-foreground">
            {config.subtitle}
          </p>
        ) : null}
      </div>

      <Visualization type={type} config={config} data={data} />

      {config.showLegend && config.datapoints.length > 0 ? (
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
    </div>
  );
}
