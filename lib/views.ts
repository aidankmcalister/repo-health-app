import type { RepoMetric } from "@/lib/metrics";

// The only visualization for now. More can be added to the picker later.
export const VIEW_TYPE_NUMBER = "number";

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
