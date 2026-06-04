"use client";

import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

/** Percent-change pill: green up, red down, muted flat. */
export function ChangePill({ value }: { value: number }) {
  const direction = value > 0 ? "up" : value < 0 ? "down" : "flat";
  const sign = value > 0 ? "+" : "";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-full border px-2 py-0.5 font-mono text-xs tabular-nums",
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
