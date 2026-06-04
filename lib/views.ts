import { METRIC_LABELS, type RepoMetric } from "@/lib/metrics";

// Visualization types. Add a new entry here + a renderer in
// components/visualizations to support a new chart.
export const VIEW_TYPE_NUMBER = "number";
export const VIEW_TYPE_LINE = "line";
export const VIEW_TYPE_AREA = "area";
export const VIEW_TYPE_BAR = "bar";

export const VIEW_TYPES = [
  { type: VIEW_TYPE_NUMBER, label: "Big Number" },
  { type: VIEW_TYPE_LINE, label: "Line Chart" },
  { type: VIEW_TYPE_AREA, label: "Area Chart" },
  { type: VIEW_TYPE_BAR, label: "Bar Chart" },
] as const;

const VALID_VIEW_TYPES = new Set<string>(VIEW_TYPES.map((entry) => entry.type));

export function isValidViewType(type: string): boolean {
  return VALID_VIEW_TYPES.has(type);
}

// Data-point labels A–Z (storage allows 26; the builder caps at MAX_DATAPOINTS).
export const ALIASES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// The view builder limits a view to this many data points (per the design).
export const MAX_DATAPOINTS = 5;

// How a Big Number rolls its windowed series up into one value.
export const AGGREGATIONS = [
  { value: "latest", label: "Latest" },
  { value: "total", label: "Total" },
  { value: "average", label: "Average" },
  { value: "maximum", label: "Maximum" },
  { value: "minimum", label: "Minimum" },
] as const;

export type Aggregation = (typeof AGGREGATIONS)[number]["value"];

export function aggregationLabel(aggregation: Aggregation | undefined): string {
  return (
    AGGREGATIONS.find((entry) => entry.value === aggregation)?.label ?? "Latest"
  );
}

// Series colors from the Tendril/Linear data-label palette.
// Default order matches the design's series order: orange → blue → purple →
// green → teal, then the rest of the label palette.
export const VIEW_COLORS = [
  { value: "#f46a3c", label: "Orange" },
  { value: "#4ea7fc", label: "Blue" },
  { value: "#b59aff", label: "Purple" },
  { value: "#4cb782", label: "Green" },
  { value: "#1fb8a6", label: "Teal" },
  { value: "#eb5757", label: "Red" },
  { value: "#f2c94c", label: "Yellow" },
  { value: "#fc7840", label: "Amber" },
] as const;

export function datapointColor(dp: ViewDatapoint, index: number): string {
  return dp.color ?? VIEW_COLORS[index % VIEW_COLORS.length].value;
}

// One labelled input to a view: a metric of a specific repo, optional color.
export type ViewDatapoint = {
  alias: string;
  repoId: string;
  metric: RepoMetric;
  color?: string;
};

// Y-axis label formatting for charts.
export type YAxisConfig = {
  decimals: number | null; // null = auto
  prefix: string | null;
  postfix: string | null;
};

// Everything a view needs, stored in View.config (Json).
export type ViewConfig = {
  title: string;
  subtitle: string | null;
  datapoints: ViewDatapoint[];
  formula: string | null;
  prefix: string | null;
  postfix: string | null;
  showLegend: boolean;
  showRepoInLabels: boolean;
  yAxis?: YAxisConfig;
  // Per-chart-type options (all optional for back-compat with older views).
  range?: number | null; // history window in days; null/undefined = all
  rangeMode?: "preset" | "since"; // preset window vs. a custom start date
  since?: string | null; // ISO date (yyyy-mm-dd) when rangeMode === "since"
  curve?: "smooth" | "linear"; // line + area
  markers?: boolean; // line
  areaFill?: "gradient" | "line"; // area
  barGrouping?: "grouped" | "stacked"; // bar
  valueLabels?: boolean; // bar
  aggregation?: Aggregation; // big number — how the window rolls up
  sparkline?: boolean; // big number — show the trend behind the value
  compare?: boolean; // big number — show change vs. the previous period
};

const DAY_MS = 86_400_000;

/** The window start timestamp for a view's range, or null for "all time". */
function windowCutoff(config: ViewConfig): number | null {
  if (config.rangeMode === "since" && config.since) {
    const parsed = Date.parse(config.since);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (config.range && config.range > 0) return Date.now() - config.range * DAY_MS;
  return null;
}

/** Trims history to the view's date-range window (null cutoff = keep all). */
function windowHistory(
  history: HistoryPoint[],
  cutoff: number | null,
): HistoryPoint[] {
  if (cutoff === null) return history;
  return history.filter((point) => point.date >= cutoff);
}

/** Rolls a series up into a single value using the given aggregation. */
function aggregateSeries(
  series: { date: number; value: number }[],
  aggregation: Aggregation,
): number | null {
  if (series.length === 0) return null;
  const values = series.map((point) => point.value);
  switch (aggregation) {
    case "total":
      return values.reduce((sum, value) => sum + value, 0);
    case "average":
      return values.reduce((sum, value) => sum + value, 0) / values.length;
    case "maximum":
      return Math.max(...values);
    case "minimum":
      return Math.min(...values);
    case "latest":
    default:
      return values[values.length - 1];
  }
}

/** Formats a y-axis tick using the view's decimals/prefix/postfix (auto if unset). */
export function formatAxisValue(value: number, yAxis?: YAxisConfig | null): string {
  const decimals = yAxis?.decimals ?? null;
  const formatted =
    decimals === null
      ? Number.isInteger(value)
        ? value.toLocaleString()
        : value.toLocaleString(undefined, { maximumFractionDigits: 2 })
      : value.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
  return `${yAxis?.prefix ?? ""}${formatted}${yAxis?.postfix ?? ""}`;
}

/** A data point's display label, optionally including the repo. */
export function datapointDisplayLabel(
  dp: ViewDatapoint,
  repos: { id: string; owner: string; name: string }[],
  showRepo: boolean,
): string {
  const metric = METRIC_LABELS[dp.metric];
  if (!showRepo) return metric;
  const repo = repos.find((r) => r.id === dp.repoId);
  return repo ? `${repo.owner}/${repo.name} · ${metric}` : metric;
}

/** Whether a view type shows its data-point legend by default. */
export function defaultShowLegend(type: string): boolean {
  return type !== VIEW_TYPE_NUMBER;
}

// Resolves a datapoint to its current numeric value (or null if unavailable).
export type MetricResolver = (
  repoId: string,
  metric: RepoMetric,
) => number | null;

// One historical snapshot value, used to build chart series.
export type HistoryPoint = {
  repoId: string;
  metric: string;
  date: number;
  value: number;
};

// A repo's current cached metric values + identity (for chart series labels).
export type ViewRepoValues = {
  id: string;
  owner: string;
  name: string;
  stars: number | null;
  openIssues: number | null;
  backfillSkipped?: string[]; // metrics whose history couldn't be backfilled
};

// Everything a visualization renderer needs.
export type ViewData = {
  value: number | null; // latest computed value (Big Number)
  series: { date: number; value: number }[]; // single computed series
  breakdown: { alias: string; value: number }[]; // current value per data point
  // Wide rows + series for multi-line charts. One series per data point
  // (no formula) or a single computed series (formula). `key` is a safe row
  // value key (no spaces — special chars break SVG gradient ids); `label` is
  // the human tooltip label; `color` is the series stroke/fill.
  chartRows: Record<string, number>[];
  chartLines: { key: string; label: string; color: string }[];
  // Percent change of the Big Number vs. the previous equal-length period
  // (null unless `compare` is on and a previous period exists).
  delta: number | null;
  // True when every data point's metric had its history skipped (capped) at
  // backfill — so charts show "history unavailable" instead of a flat line.
  unavailable: boolean;
};

/** Builds the data a view's visualization needs from current values + history. */
export function buildViewData(
  config: ViewConfig,
  repos: ViewRepoValues[],
  history: HistoryPoint[],
): ViewData {
  // Latest snapshot value per (repo, metric) — covers every metric.
  const latest = new Map<string, { date: number; value: number }>();
  for (const point of history) {
    const key = `${point.repoId}|${point.metric}`;
    const current = latest.get(key);
    if (!current || point.date > current.date) {
      latest.set(key, { date: point.date, value: point.value });
    }
  }

  const resolve: MetricResolver = (repoId, metric) => {
    const snapshot = latest.get(`${repoId}|${metric}`);
    if (snapshot) return snapshot.value;
    // Fall back to the repo's cached fields (e.g. on the home page, no history).
    const repo = repos.find((r) => r.id === repoId);
    if (!repo) return null;
    if (metric === "stars") return repo.stars;
    if (metric === "open_issues") return repo.openIssues;
    return null;
  };

  const breakdown = config.datapoints
    .map((point) => ({ alias: point.alias, value: resolve(point.repoId, point.metric) }))
    .filter((entry): entry is { alias: string; value: number } => entry.value !== null);

  // Everything respects the date-range window. The Big Number rolls the
  // windowed series up with its aggregation; charts plot it over time.
  const cutoff = windowCutoff(config);
  const windowed = windowHistory(history, cutoff);
  const windowedSeries = computeViewSeries(config, windowed);
  const chart = computeChart(config, repos, windowed);

  const aggregation = config.aggregation ?? "latest";
  const value =
    windowedSeries.length > 0
      ? aggregateSeries(windowedSeries, aggregation)
      : computeViewValue(config, resolve); // fall back to cached/latest

  const delta = config.compare
    ? computeDelta(config, history, cutoff, aggregation, value)
    : null;

  const unavailable =
    config.datapoints.length > 0 &&
    config.datapoints.every((dp) => {
      const repo = repos.find((r) => r.id === dp.repoId);
      return repo?.backfillSkipped?.includes(dp.metric) ?? false;
    });

  return {
    value,
    series: windowedSeries,
    breakdown,
    chartRows: chart.rows,
    chartLines: chart.lines,
    delta,
    unavailable,
  };
}

/** Percent change of the aggregated value vs. the previous equal-length period. */
function computeDelta(
  config: ViewConfig,
  history: HistoryPoint[],
  cutoff: number | null,
  aggregation: Aggregation,
  current: number | null,
): number | null {
  if (cutoff === null || current === null) return null;
  const length = Date.now() - cutoff;
  const previous = history.filter(
    (point) => point.date >= cutoff - length && point.date < cutoff,
  );
  const previousValue = aggregateSeries(
    computeViewSeries(config, previous),
    aggregation,
  );
  if (previousValue === null || previousValue === 0) return null;
  return ((current - previousValue) / previousValue) * 100;
}

/**
 * Builds wide chart rows + series keys. With a formula (or a single data point)
 * it's one computed series; otherwise one series per data point so each renders
 * as its own line. Series keys double as tooltip labels.
 */
function computeChart(
  config: ViewConfig,
  repos: ViewRepoValues[],
  history: HistoryPoint[],
): {
  rows: Record<string, number>[];
  lines: { key: string; label: string; color: string }[];
} {
  const showRepo = config.showRepoInLabels ?? false;

  if (config.formula || config.datapoints.length <= 1) {
    const first = config.datapoints[0];
    // A formula collapses the points into one computed series, so the view
    // title is the right label. With a single plain data point, label the line
    // with the data point itself (matching the legend), not the view name.
    const label = config.formula
      ? config.title?.trim() || "Value"
      : first
        ? datapointDisplayLabel(first, repos, showRepo)
        : config.title?.trim() || "Value";
    const color = first ? datapointColor(first, 0) : VIEW_COLORS[0].value;
    const series = computeViewSeries(config, history);
    return {
      rows: series.map((point) => ({ date: point.date, s0: point.value })),
      lines: series.length > 0 ? [{ key: "s0", label, color }] : [],
    };
  }

  const byKey = new Map<string, { date: number; value: number }[]>();
  for (const point of history) {
    const key = `${point.repoId}|${point.metric}`;
    const list = byKey.get(key);
    if (list) list.push({ date: point.date, value: point.value });
    else byKey.set(key, [{ date: point.date, value: point.value }]);
  }
  for (const list of byKey.values()) list.sort((a, b) => a.date - b.date);

  const usedLabels = new Set<string>();
  const defs = config.datapoints.map((dp, index) => {
    let label = datapointDisplayLabel(dp, repos, showRepo);
    while (usedLabels.has(label)) label = `${label} (${dp.alias})`;
    usedLabels.add(label);
    return {
      key: `s${index}`, // safe key — SVG gradient ids can't contain spaces/·//
      label,
      color: datapointColor(dp, index),
      points: byKey.get(`${dp.repoId}|${dp.metric}`) ?? [],
    };
  });

  const dateSet = new Set<number>();
  for (const def of defs) for (const point of def.points) dateSet.add(point.date);
  const dates = [...dateSet].sort((a, b) => a - b);

  const rows: Record<string, number>[] = [];
  for (const date of dates) {
    const row: Record<string, number> = { date };
    let any = false;
    for (const def of defs) {
      const value = latestAtOrBefore(def.points, date);
      if (value !== null) {
        row[def.key] = value;
        any = true;
      }
    }
    if (any) rows.push(row);
  }

  return {
    rows,
    lines: defs.map((def) => ({
      key: def.key,
      label: def.label,
      color: def.color,
    })),
  };
}

/**
 * Computes a view's value: evaluates the formula over the datapoints, or falls
 * back to the first datapoint's value when there is no formula. Returns null if
 * a referenced value is missing or the formula can't be evaluated.
 */
export function computeViewValue(
  config: ViewConfig,
  resolve: MetricResolver,
): number | null {
  const vars: Record<string, number> = {};
  for (const point of config.datapoints) {
    const value = resolve(point.repoId, point.metric);
    if (value === null) continue;
    vars[point.alias] = value;
  }

  if (config.formula) {
    return evaluateFormula(config.formula, vars);
  }

  const first = config.datapoints[0];
  return first ? vars[first.alias] ?? null : null;
}

/**
 * Builds a time series of the view's value by evaluating it at each snapshot
 * date, forward-filling each data point's most recent value at-or-before that
 * date (so repos that sync at different times still align).
 */
export function computeViewSeries(
  config: ViewConfig,
  history: HistoryPoint[],
): { date: number; value: number }[] {
  if (config.datapoints.length === 0) return [];

  const byKey = new Map<string, { date: number; value: number }[]>();
  for (const point of history) {
    const key = `${point.repoId}|${point.metric}`;
    const list = byKey.get(key);
    if (list) list.push({ date: point.date, value: point.value });
    else byKey.set(key, [{ date: point.date, value: point.value }]);
  }
  for (const list of byKey.values()) list.sort((a, b) => a.date - b.date);

  const aliasKeys = config.datapoints.map((dp) => ({
    alias: dp.alias,
    key: `${dp.repoId}|${dp.metric}`,
  }));
  const relevant = new Set(aliasKeys.map((entry) => entry.key));
  const dates = [
    ...new Set(
      history
        .filter((point) => relevant.has(`${point.repoId}|${point.metric}`))
        .map((point) => point.date),
    ),
  ].sort((a, b) => a - b);

  const series: { date: number; value: number }[] = [];
  for (const date of dates) {
    const vars: Record<string, number> = {};
    let complete = true;
    for (const { alias, key } of aliasKeys) {
      const value = latestAtOrBefore(byKey.get(key), date);
      if (value === null) {
        complete = false;
        break;
      }
      vars[alias] = value;
    }
    if (!complete) continue;

    const value = config.formula
      ? evaluateFormula(config.formula, vars)
      : vars[config.datapoints[0].alias] ?? null;
    if (value !== null && Number.isFinite(value)) {
      series.push({ date, value });
    }
  }
  return series;
}

function latestAtOrBefore(
  points: { date: number; value: number }[] | undefined,
  date: number,
): number | null {
  if (!points || points.length === 0) return null;
  let result: number | null = null;
  for (const point of points) {
    if (point.date <= date) result = point.value;
    else break;
  }
  return result;
}

/** Formats a computed value with the view's prefix/postfix, or "—" if null. */
export function formatViewValue(
  value: number | null,
  config: ViewConfig,
): string {
  if (value === null) return "—";
  const rounded = Number.isInteger(value)
    ? value.toLocaleString()
    : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return `${config.prefix ?? ""}${rounded}${config.postfix ?? ""}`;
}

// ─── Safe arithmetic evaluator ────────────────────────────────────────
// Supports + - * / parentheses, decimals, unary minus, and single-letter
// variables (A–Z). No eval; returns null on any parse/eval problem.

type Token = { type: "num" | "var" | "op" | "paren"; value: string };

export function evaluateFormula(
  expr: string,
  vars: Record<string, number>,
): number | null {
  try {
    const tokens = tokenize(expr);
    const parser = new Parser(tokens, vars);
    const result = parser.parse();
    return Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const char = expr[i];
    if (char === " ") {
      i++;
    } else if (/[0-9.]/.test(char)) {
      let num = "";
      while (i < expr.length && /[0-9.]/.test(expr[i])) num += expr[i++];
      tokens.push({ type: "num", value: num });
    } else if (/[A-Za-z]/.test(char)) {
      tokens.push({ type: "var", value: char.toUpperCase() });
      i++;
    } else if ("+-*/".includes(char)) {
      tokens.push({ type: "op", value: char });
      i++;
    } else if (char === "(" || char === ")") {
      tokens.push({ type: "paren", value: char });
      i++;
    } else {
      throw new Error(`Unexpected character: ${char}`);
    }
  }
  return tokens;
}

class Parser {
  private pos = 0;

  constructor(
    private readonly tokens: Token[],
    private readonly vars: Record<string, number>,
  ) {}

  parse(): number {
    const value = this.expression();
    if (this.pos !== this.tokens.length) {
      throw new Error("Unexpected trailing tokens.");
    }
    return value;
  }

  private expression(): number {
    let value = this.term();
    while (this.peek()?.type === "op" && "+-".includes(this.peek()!.value)) {
      const op = this.next().value;
      const right = this.term();
      value = op === "+" ? value + right : value - right;
    }
    return value;
  }

  private term(): number {
    let value = this.factor();
    while (this.peek()?.type === "op" && "*/".includes(this.peek()!.value)) {
      const op = this.next().value;
      const right = this.factor();
      value = op === "*" ? value * right : value / right;
    }
    return value;
  }

  private factor(): number {
    const token = this.peek();
    if (!token) throw new Error("Unexpected end of formula.");

    if (token.type === "op" && token.value === "-") {
      this.next();
      return -this.factor();
    }
    if (token.type === "num") {
      this.next();
      return Number(token.value);
    }
    if (token.type === "var") {
      this.next();
      const value = this.vars[token.value];
      if (value === undefined) throw new Error(`Unknown variable: ${token.value}`);
      return value;
    }
    if (token.type === "paren" && token.value === "(") {
      this.next();
      const value = this.expression();
      if (this.next().value !== ")") throw new Error("Expected ).");
      return value;
    }
    throw new Error(`Unexpected token: ${token.value}`);
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private next(): Token {
    return this.tokens[this.pos++];
  }
}
