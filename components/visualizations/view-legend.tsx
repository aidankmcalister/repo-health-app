"use client";

import {
  datapointColor,
  datapointDisplayLabel,
  type ViewConfig,
} from "@/lib/views";

type LegendRepo = { id: string; owner: string; name: string };

/** Shared chart legend: one swatch + label per data point, mono and muted. */
export function ViewLegend({
  config,
  repos,
}: {
  config: ViewConfig;
  repos: LegendRepo[];
}) {
  if (!config.showLegend || config.datapoints.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
      {config.datapoints.map((point, index) => (
        <li
          key={point.alias}
          className="flex items-center gap-2 font-mono text-[11px] text-[var(--ink-subtle)]"
        >
          <span
            className="h-0.5 w-4 shrink-0 rounded-full"
            style={{ backgroundColor: datapointColor(point, index) }}
          />
          <span className="truncate">
            {datapointDisplayLabel(point, repos, config.showRepoInLabels)}
          </span>
        </li>
      ))}
    </ul>
  );
}
