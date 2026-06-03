import type { RepoMetric } from "@/lib/metrics";

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

// Data-point labels A–Z (max 26 per view).
export const ALIASES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// One labelled input to a view: a metric of a specific repo.
export type ViewDatapoint = {
  alias: string;
  repoId: string;
  metric: RepoMetric;
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
};

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

// A repo's current cached metric values.
export type ViewRepoValues = {
  id: string;
  stars: number | null;
  openIssues: number | null;
};

// Everything a visualization renderer needs: latest value, a time series, and a
// per-data-point breakdown of current values (for categorical charts).
export type ViewData = {
  value: number | null;
  series: { date: number; value: number }[];
  breakdown: { alias: string; value: number }[];
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

  return {
    value: computeViewValue(config, resolve),
    series: computeViewSeries(config, history),
    breakdown,
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
