"use client";

import { createView, deleteView, updateView } from "@/app/actions/views";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Visualization } from "@/components/visualizations";
import { ChangePill } from "@/components/visualizations/change-pill";
import { ViewLegend } from "@/components/visualizations/view-legend";
import { METRIC_LABELS, REPO_METRICS, type RepoMetric } from "@/lib/metrics";
import { cn } from "@/lib/utils";
import {
  AGGREGATIONS,
  ALIASES,
  buildViewData,
  datapointColor,
  defaultShowLegend,
  MAX_DATAPOINTS,
  VIEW_COLORS,
  VIEW_TYPE_AREA,
  VIEW_TYPE_BAR,
  VIEW_TYPE_LINE,
  VIEW_TYPE_NUMBER,
  VIEW_TYPES,
  type Aggregation,
  type HistoryPoint,
  type ViewConfig,
  type ViewDatapoint,
} from "@/lib/views";
import {
  ArrowRight,
  ChartArea,
  ChartColumn,
  ChartLine,
  Hash,
  Plus,
  Table,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export type ViewRepo = {
  id: string;
  owner: string;
  name: string;
  stars: number | null;
  openIssues: number | null;
};

const TYPE_ICONS: Record<string, LucideIcon> = {
  number: Hash,
  line: ChartLine,
  area: ChartArea,
  bar: ChartColumn,
};

const CURVE_OPTIONS = [
  { value: "smooth", label: "Smooth" },
  { value: "linear", label: "Linear" },
];
const FILL_OPTIONS = [
  { value: "gradient", label: "Gradient" },
  { value: "line", label: "Line" },
];
const BAR_OPTIONS = [
  { value: "grouped", label: "Grouped" },
  { value: "stacked", label: "Stacked" },
];

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
  const [range, setRange] = useState<number | null>(
    isEdit ? (props.initialConfig.range ?? 90) : 90,
  );
  const [curve, setCurve] = useState<"smooth" | "linear">(
    isEdit ? (props.initialConfig.curve ?? "smooth") : "smooth",
  );
  const [markers, setMarkers] = useState(
    isEdit ? (props.initialConfig.markers ?? false) : false,
  );
  const [areaFill, setAreaFill] = useState<"gradient" | "line">(
    isEdit ? (props.initialConfig.areaFill ?? "gradient") : "gradient",
  );
  const [barGrouping, setBarGrouping] = useState<"grouped" | "stacked">(
    isEdit ? (props.initialConfig.barGrouping ?? "grouped") : "grouped",
  );
  const [valueLabels, setValueLabels] = useState(
    isEdit ? (props.initialConfig.valueLabels ?? false) : false,
  );
  const [rangeMode, setRangeMode] = useState<"preset" | "since">(
    isEdit ? (props.initialConfig.rangeMode ?? "preset") : "preset",
  );
  const [since, setSince] = useState<string | null>(
    isEdit ? (props.initialConfig.since ?? null) : null,
  );
  const [aggregation, setAggregation] = useState<Aggregation>(
    isEdit ? (props.initialConfig.aggregation ?? "latest") : "latest",
  );
  const [sparkline, setSparkline] = useState(
    isEdit ? (props.initialConfig.sparkline ?? false) : false,
  );
  const [compare, setCompare] = useState(
    isEdit ? (props.initialConfig.compare ?? false) : false,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  const canAddDatapoint =
    repos.length > 0 && datapoints.length < MAX_DATAPOINTS;
  const activeCount = datapoints.filter((point) =>
    repos.some((repo) => repo.id === point.repoId),
  ).length;
  const isNumber = type === VIEW_TYPE_NUMBER;
  const typeLabel =
    VIEW_TYPES.find((entry) => entry.type === type)?.label ?? "view";

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
    range,
    rangeMode,
    since: rangeMode === "since" ? since : null,
    curve,
    markers,
    areaFill,
    barGrouping,
    valueLabels,
    aggregation,
    sparkline,
    compare,
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
        toast.success("View deleted");
      } else {
        setError(result.error ?? "Failed to delete view.");
      }
    });
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = isEdit
        ? await updateView(props.viewId, type, config)
        : await createView(dashboardId, type, config);
      if (result.ok) {
        onOpenChange(false);
        router.refresh();
        toast.success(
          <span>
            {isEdit ? "Updated" : "Created"}{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              {title || "Untitled view"}
            </code>
          </span>,
        );
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex h-[min(640px,88vh)] w-[min(960px,94vw)] max-w-none flex-col gap-0 overflow-hidden border-[var(--hairline-strong)] bg-[var(--canvas)] p-0 sm:max-w-none"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center gap-2.5 border-b border-[var(--hairline)] px-4 py-3">
          <span className="text-primary">
            {(() => {
              const Icon = TYPE_ICONS[type] ?? Hash;
              return <Icon className="size-[15px]" />;
            })()}
          </span>
          <DialogTitle className="text-[15px] font-semibold tracking-[-0.2px] text-foreground">
            {isEdit ? "Edit" : "New"} {typeLabel.toLowerCase()} view
          </DialogTitle>
          <DialogDescription className="sr-only">
            Build a metric from this dashboard&apos;s repos.
          </DialogDescription>
        </div>

        {/* Body: rail · config · preview */}
        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[148px_minmax(0,1fr)_300px]">
          {/* Rail */}
          <div className="hidden flex-col gap-0.5 overflow-y-auto border-r border-[var(--hairline)] p-2.5 md:flex">
            <div className="px-2 pb-1.5 pt-1.5 text-[10.5px] tracking-[0.4px] text-[var(--ink-tertiary)]">
              CHART TYPE
            </div>
            {VIEW_TYPES.map((entry) => {
              const Icon = TYPE_ICONS[entry.type] ?? Hash;
              const active = entry.type === type;
              return (
                <button
                  key={entry.type}
                  type="button"
                  onClick={() => changeType(entry.type)}
                  className={cn(
                    "relative flex h-8 items-center gap-2.5 whitespace-nowrap rounded-md px-2.5 text-[13px] transition-colors",
                    active
                      ? "bg-secondary text-foreground before:absolute before:-left-2.5 before:bottom-2 before:top-2 before:w-0.5 before:rounded-full before:bg-primary"
                      : "text-[var(--ink-subtle)] hover:bg-[var(--surface-1)] hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-[15px] shrink-0",
                      active ? "text-primary" : "text-[var(--ink-tertiary)]",
                    )}
                  />
                  <span>{entry.label}</span>
                </button>
              );
            })}
            <div className="my-2 h-px bg-[var(--hairline)]" />
            <div className="px-2 pb-1.5 text-[10.5px] tracking-[0.4px] text-[var(--ink-tertiary)]">
              UPCOMING
            </div>
            <div className="flex h-8 cursor-default items-center gap-2.5 whitespace-nowrap rounded-md px-2.5 text-[13px] text-[var(--ink-tertiary)]">
              <Table className="size-[15px] shrink-0" />
              <span>Table</span>
              <span className="ml-auto rounded-full border border-[var(--hairline)] px-1.5 py-px font-mono text-[8.5px] uppercase tracking-[0.4px] text-[var(--ink-tertiary)]">
                soon
              </span>
            </div>
          </div>

          {/* Config */}
          <div className="flex min-w-0 flex-col gap-[18px] overflow-y-auto p-[18px]">
            {/* Type (mobile only — rail is hidden) */}
            <div className="flex flex-col gap-1.5 md:hidden">
              <FieldLabel>Chart type</FieldLabel>
              <Select value={type} onValueChange={changeType}>
                <SelectTrigger className="w-full">
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

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Name</FieldLabel>
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Untitled view"
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel>
                  Subtitle <span className="text-[var(--ink-tertiary)]">· optional</span>
                </FieldLabel>
                <Input
                  value={subtitle}
                  onChange={(event) => setSubtitle(event.target.value)}
                  placeholder="Shown under the title"
                />
              </div>
            </div>

            {/* Chart options — distinct per chart type, per the design */}
            <Section title="Chart options">
              {isNumber ? (
                <>
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Aggregation</FieldLabel>
                    <Select
                      value={aggregation}
                      onValueChange={(value) =>
                        setAggregation(value as Aggregation)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AGGREGATIONS.map((entry) => (
                          <SelectItem key={entry.value} value={entry.value}>
                            {entry.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>
                      Format{" "}
                      <span className="text-[var(--ink-tertiary)]">
                        · optional
                      </span>
                    </FieldLabel>
                    <div className="grid grid-cols-2 gap-2.5">
                      <Input
                        value={prefix}
                        onChange={(event) => setPrefix(event.target.value)}
                        placeholder="Prefix · $"
                      />
                      <Input
                        value={postfix}
                        onChange={(event) => setPostfix(event.target.value)}
                        placeholder="Postfix · %"
                      />
                    </div>
                  </div>
                  <ToggleRow
                    label="Trend sparkline"
                    checked={sparkline}
                    onChange={setSparkline}
                  />
                  <ToggleRow
                    label="Compare to previous period"
                    checked={compare}
                    onChange={setCompare}
                  />
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Date range</FieldLabel>
                    <DateRange
                      range={range}
                      mode={rangeMode}
                      since={since}
                      onChange={(patch) => {
                        if (patch.rangeMode !== undefined)
                          setRangeMode(patch.rangeMode);
                        if (patch.range !== undefined) setRange(patch.range);
                        if (patch.since !== undefined) setSince(patch.since);
                      }}
                    />
                  </div>

                  {type === VIEW_TYPE_LINE ? (
                    <>
                      <div className="flex flex-col gap-1.5">
                        <FieldLabel>Curve</FieldLabel>
                        <Segmented
                          value={curve}
                          onChange={(v) => setCurve(v as "smooth" | "linear")}
                          options={CURVE_OPTIONS}
                        />
                      </div>
                      <ToggleRow
                        label="Markers"
                        checked={markers}
                        onChange={setMarkers}
                      />
                    </>
                  ) : null}

                  {type === VIEW_TYPE_AREA ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <FieldLabel>Curve</FieldLabel>
                        <Segmented
                          value={curve}
                          onChange={(v) => setCurve(v as "smooth" | "linear")}
                          options={CURVE_OPTIONS}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <FieldLabel>Fill</FieldLabel>
                        <Segmented
                          value={areaFill}
                          onChange={(v) =>
                            setAreaFill(v as "gradient" | "line")
                          }
                          options={FILL_OPTIONS}
                        />
                      </div>
                    </div>
                  ) : null}

                  {type === VIEW_TYPE_BAR ? (
                    <>
                      <div className="flex flex-col gap-1.5">
                        <FieldLabel>Bars</FieldLabel>
                        <Segmented
                          value={barGrouping}
                          onChange={(v) =>
                            setBarGrouping(v as "grouped" | "stacked")
                          }
                          options={BAR_OPTIONS}
                        />
                      </div>
                      <ToggleRow
                        label="Value labels"
                        checked={valueLabels}
                        onChange={setValueLabels}
                      />
                    </>
                  ) : null}

                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Y-axis labels</FieldLabel>
                    <div className="grid grid-cols-3 gap-2.5">
                      <Select value={yDecimals} onValueChange={setYDecimals}>
                        <SelectTrigger className="w-full">
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
                      <Input
                        value={yPrefix}
                        onChange={(event) => setYPrefix(event.target.value)}
                        placeholder="Prefix"
                      />
                      <Input
                        value={yPostfix}
                        onChange={(event) => setYPostfix(event.target.value)}
                        placeholder="Postfix"
                      />
                    </div>
                  </div>

                  <ToggleRow
                    label="Show legend"
                    checked={showLegend}
                    onChange={setShowLegend}
                  />
                  <ToggleRow
                    label="Show repo in labels"
                    checked={showRepoInLabels}
                    onChange={setShowRepoInLabels}
                  />
                </>
              )}

              <ToggleRow
                label="Use a formula"
                checked={formulaEnabled}
                onChange={setFormulaEnabled}
              />
              {formulaEnabled ? (
                <div className="flex flex-col gap-1.5">
                  <Input
                    value={formula}
                    onChange={(event) => setFormula(event.target.value)}
                    placeholder="A / B * 100"
                    className="font-mono"
                  />
                  <p className="text-[11.5px] leading-relaxed text-[var(--ink-tertiary)]">
                    Reference data points by their letter, e.g.{" "}
                    <code className="font-mono text-[var(--ink-muted)]">
                      A / B * 100
                    </code>
                    .
                  </p>
                </div>
              ) : null}
            </Section>

            {/* Data points */}
            <Section
              title="Data points"
              count={`${datapoints.length}/${MAX_DATAPOINTS}`}
              action={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addDatapoint}
                  disabled={!canAddDatapoint}
                >
                  <Plus className="size-3" />
                  Add
                </Button>
              }
            >
              <p className="-mt-1 text-[11.5px] leading-relaxed text-[var(--ink-tertiary)]">
                {isNumber ? (
                  <>
                    Each point&apos;s metric is rolled up across the window — set
                    how with{" "}
                    <b className="font-medium text-[var(--ink-muted)]">
                      Aggregation
                    </b>
                    .
                  </>
                ) : (
                  "Each point plots one repo's metric over the selected range."
                )}
              </p>
              {repos.length === 0 ? (
                <p className="text-[12.5px] text-[var(--ink-tertiary)]">
                  Add repos to this dashboard first.
                </p>
              ) : datapoints.length === 0 ? (
                <p className="text-[12.5px] text-[var(--ink-tertiary)]">
                  No data points yet — add one to plot a metric.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {datapoints.map((point, index) => (
                    <div
                      key={point.alias}
                      className="flex items-center gap-2 rounded-md border border-[var(--hairline)] bg-[var(--surface-1)] px-2.5 py-2 transition-colors hover:border-[var(--hairline-strong)]"
                    >
                      <DatapointBadge
                        letter={point.alias}
                        color={point.color ?? datapointColor(point, index)}
                        onChange={(color) =>
                          updateDatapoint(point.alias, { color })
                        }
                      />
                      <div className="min-w-0 flex-[1.5]">
                        <Select
                          value={point.metric}
                          onValueChange={(metric) =>
                            updateDatapoint(point.alias, {
                              metric: metric as RepoMetric,
                            })
                          }
                        >
                          <SelectTrigger size="sm" className="w-full">
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
                      </div>
                      <div className="min-w-0 flex-[1.3]">
                        <Select
                          value={point.repoId}
                          onValueChange={(repoId) =>
                            updateDatapoint(point.alias, { repoId })
                          }
                        >
                          <SelectTrigger size="sm" className="w-full">
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
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDatapoint(point.alias)}
                        title="Remove data point"
                        className="flex size-6 shrink-0 items-center justify-center rounded text-[var(--ink-tertiary)] transition-colors hover:bg-[color-mix(in_srgb,var(--destructive)_14%,transparent)] hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                        <span className="sr-only">Remove {point.alias}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {error ? (
              <p className="text-[12.5px] text-destructive">{error}</p>
            ) : null}
          </div>

          {/* Preview */}
          <div className="hidden min-w-0 flex-col gap-3 border-l border-[var(--hairline)] bg-[var(--surface-1)] p-4 md:flex">
            <div className="flex items-end justify-between gap-2 border-b border-[var(--hairline)] pb-2.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.3px] text-[var(--ink-tertiary)]">
                Live preview
              </span>
              <span className="text-right font-mono text-[10.5px] text-[var(--ink-subtle)]">
                {typeLabel}
                {!isNumber
                  ? rangeMode === "since"
                    ? " · custom"
                    : ` · ${range ? `${range}d` : "all"}`
                  : ""}{" "}
                · {datapoints.length}{" "}
                {datapoints.length === 1 ? "point" : "points"}
              </span>
            </div>
            <div className="flex flex-1 items-center">
              <div className="w-full">
                <ViewPreview
                  type={type}
                  config={config}
                  repos={repos}
                  history={history}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-[var(--hairline)] bg-[var(--surface-1)] px-4 py-3">
          <span className="font-mono text-[11px] text-[var(--ink-tertiary)]">
            {activeCount} of {datapoints.length}{" "}
            {datapoints.length === 1 ? "point" : "points"} active
          </span>
          <div className="flex items-center gap-2">
            {isEdit ? (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="size-4" />
                {isDeleting ? "Deleting…" : "Delete"}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Saving…" : "Save view"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10.5px] uppercase tracking-[0.4px] text-[var(--ink-tertiary)]">
      {children}
    </span>
  );
}

function Section({
  title,
  count,
  action,
  children,
}: {
  title: string;
  count?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-2.5">
        <span className="text-[11px] font-medium tracking-[0.3px] text-[var(--ink-subtle)]">
          {title}
          {count ? (
            <span className="ml-1.5 font-mono text-[var(--ink-tertiary)]">
              {count}
            </span>
          ) : null}
        </span>
        {action}
      </div>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5">
      <Switch checked={checked} onCheckedChange={onChange} />
      <span className="text-[13px] text-[var(--ink-muted)]">{label}</span>
    </label>
  );
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="inline-flex gap-0.5 self-start rounded-md border border-[var(--hairline)] bg-[var(--surface-1)] p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "h-7 rounded-[6px] px-3 text-[13px] font-medium transition-colors",
            option.value === value
              ? "bg-[var(--surface-3)] text-foreground"
              : "text-[var(--ink-subtle)] hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

type DateRangePatch = {
  range?: number | null;
  rangeMode?: "preset" | "since";
  since?: string | null;
};

function DateRange({
  range,
  mode,
  since,
  onChange,
}: {
  range: number | null;
  mode: "preset" | "since";
  since: string | null;
  onChange: (patch: DateRangePatch) => void;
}) {
  const isSince = mode === "since";
  const today = new Date().toISOString().slice(0, 10);
  const presetFrom = () => {
    const date = new Date();
    date.setDate(date.getDate() - ((range || 30) - 1));
    return date.toISOString().slice(0, 10);
  };
  const shownFrom = isSince ? (since ?? "") : presetFrom();
  const presets = [
    { v: 7, l: "7D" },
    { v: 30, l: "30D" },
    { v: 90, l: "90D" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="inline-flex gap-0.5 self-start border-b border-[var(--hairline)]">
        {presets.map((preset) => (
          <button
            key={preset.l}
            type="button"
            onClick={() => onChange({ rangeMode: "preset", range: preset.v })}
            className={cn(
              "-mb-px h-8 border-b-2 px-3 text-[13.5px] tabular-nums transition-colors",
              !isSince && range === preset.v
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-[var(--ink-subtle)] hover:text-foreground",
            )}
          >
            {preset.l}
          </button>
        ))}
        <button
          type="button"
          onClick={() =>
            onChange({ rangeMode: "since", since: since ?? presetFrom() })
          }
          className={cn(
            "-mb-px h-8 border-b-2 px-3 text-[13.5px] transition-colors",
            isSince
              ? "border-primary font-medium text-foreground"
              : "border-transparent text-[var(--ink-subtle)] hover:text-foreground",
          )}
        >
          Custom
        </button>
      </div>

      <div className="flex items-center gap-2.5">
        <input
          type="date"
          value={shownFrom}
          max={today}
          disabled={!isSince}
          onChange={(event) =>
            onChange({ rangeMode: "since", since: event.target.value })
          }
          title={
            isSince
              ? "Pick a start date"
              : "Preset window start — switch to Custom to edit"
          }
          className="h-9 flex-1 rounded-md border border-border bg-[var(--surface-1)] px-3 font-mono text-[12.5px] text-foreground outline-none transition-colors [color-scheme:dark] focus-visible:border-[var(--hairline-strong)] focus-visible:ring-3 focus-visible:ring-ring/50 disabled:bg-[var(--surface-2)] disabled:text-[var(--ink-subtle)]"
        />
        <ArrowRight className="size-3.5 shrink-0 text-[var(--ink-tertiary)]" />
        <span className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-border bg-[var(--surface-2)] px-3 font-mono text-[12.5px] text-[var(--ink-muted)]">
          <span className="size-1.5 rounded-full bg-[var(--success)] shadow-[0_0_0_3px_color-mix(in_srgb,var(--success)_22%,transparent)]" />
          now
        </span>
      </div>
    </div>
  );
}

function DatapointBadge({
  letter,
  color,
  onChange,
}: {
  letter: string;
  color: string;
  onChange: (color: string) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Series color"
          className="flex size-[22px] shrink-0 items-center justify-center rounded-[6px] border font-mono text-[11px] font-semibold leading-none"
          style={{ borderColor: color, color }}
        >
          {letter}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="grid grid-cols-4 gap-1.5">
          {VIEW_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => onChange(c.value)}
              title={c.label}
              className="flex size-6 items-center justify-center rounded-[6px] border font-mono text-[11px] font-semibold leading-none"
              style={{
                borderColor: c.value,
                color: c.value,
                background:
                  c.value === color
                    ? `color-mix(in srgb, ${c.value} 22%, transparent)`
                    : "transparent",
              }}
            >
              {letter}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
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

  if (config.datapoints.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-[var(--hairline-strong)] px-4 py-10 text-center">
        <p className="text-[13.5px] text-foreground">Nothing to preview</p>
        <p className="text-[12.5px] text-[var(--ink-subtle)]">
          Add a data point to render the chart.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 overflow-hidden rounded-lg border border-[var(--hairline)] bg-[var(--canvas)] px-5 py-[18px]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium leading-tight text-foreground">
            {config.title || "Untitled view"}
          </p>
          {config.subtitle ? (
            <p className="mt-1 font-mono text-[11.5px] break-words text-[var(--ink-subtle)]">
              {config.subtitle}
            </p>
          ) : null}
        </div>
        {config.compare && data.delta !== null ? (
          <ChangePill value={data.delta} />
        ) : null}
      </div>

      <Visualization type={type} config={config} data={data} />

      <ViewLegend config={config} repos={repos} />
    </div>
  );
}
