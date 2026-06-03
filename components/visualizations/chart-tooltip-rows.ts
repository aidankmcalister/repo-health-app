import type { ViewData } from "@/lib/views";

/**
 * Builds a ChartTooltip `rows` renderer that maps each series' safe key to its
 * human label + color (the default tooltip would show the raw "s0" key).
 */
export function tooltipRows(lines: ViewData["chartLines"]) {
  return (point: Record<string, unknown>) =>
    lines.map((line) => {
      const value = point[line.key];
      return {
        color: line.color,
        label: line.label,
        value: typeof value === "number" ? value.toLocaleString() : "—",
      };
    });
}
