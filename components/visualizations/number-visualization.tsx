"use client";

import { cn } from "@/lib/utils";
import {
  aggregationLabel,
  datapointColor,
  formatViewValue,
  type ViewConfig,
} from "@/lib/views";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useId } from "react";
import type { VisualizationProps } from "./types";

/** Big Number: the aggregated value, with an optional change pill + sparkline. */
export function NumberVisualization({ config, data }: VisualizationProps) {
  const showPill = Boolean(config.compare) && data.delta !== null;
  const showSparkline = Boolean(config.sparkline) && data.series.length >= 2;
  const color = config.datapoints[0]
    ? datapointColor(config.datapoints[0], 0)
    : "var(--primary)";

  return (
    <div className="flex flex-1 flex-col">
      {showPill ? (
        <div className="flex justify-end">
          <ChangePill value={data.delta as number} />
        </div>
      ) : null}

      <div
        className={cn(
          "flex flex-1 flex-col justify-center py-4",
          showSparkline ? "items-start text-left" : "items-center text-center",
        )}
      >
        <p className="text-5xl font-semibold tracking-[-1.6px] tabular-nums text-foreground">
          {formatViewValue(data.value, config)}
        </p>
        <p className="mt-2 font-mono text-[11.5px] text-[var(--ink-subtle)]">
          {aggregationLabel(config.aggregation)} · {rangeLabel(config)}
        </p>
      </div>

      {showSparkline ? (
        <Sparkline
          values={data.series.map((point) => point.value)}
          color={color}
        />
      ) : null}
    </div>
  );
}

function rangeLabel(config: ViewConfig): string {
  if (config.rangeMode === "since" && config.since) return `since ${config.since}`;
  if (config.range && config.range > 0) return `last ${config.range} days`;
  return "all time";
}

function ChangePill({ value }: { value: number }) {
  const direction = value > 0 ? "up" : value < 0 ? "down" : "flat";
  const sign = value > 0 ? "+" : "";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 font-mono text-xs tabular-nums",
        direction === "up" &&
          "border-[color-mix(in_srgb,var(--success)_28%,transparent)] bg-[color-mix(in_srgb,var(--success)_14%,var(--surface-1))] text-[var(--success)]",
        direction === "down" &&
          "border-[color-mix(in_srgb,var(--destructive)_28%,transparent)] bg-[color-mix(in_srgb,var(--destructive)_14%,var(--surface-1))] text-destructive",
        direction === "flat" &&
          "border-border bg-secondary text-[var(--ink-subtle)]",
      )}
    >
      {direction === "up" ? <ChevronUp className="size-3" /> : null}
      {direction === "down" ? <ChevronDown className="size-3" /> : null}
      {sign}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

/** Lightweight trend sparkline (filled area) — self-contained SVG, no axes. */
function Sparkline({ values, color }: { values: number[]; color: string }) {
  const gradientId = useId();
  const width = 300;
  const height = 56;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = 6 + (1 - (value - min) / span) * (height - 12);
    return [x, y] as const;
  });
  const line = points
    .map(
      ([x, y], index) =>
        `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`,
    )
    .join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;

  // Bleed to the card's bottom/left/right edges by cancelling its padding
  // (px-5 / pb-[18px] on both the dashboard card and the modal preview).
  return (
    <div className="-mx-5 -mb-[18px] mt-3">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="block h-20 w-full"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
