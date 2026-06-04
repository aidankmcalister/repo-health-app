"use client";

import { Bar } from "@/components/charts/bar";
import { BarChart } from "@/components/charts/bar-chart";
import { Grid } from "@/components/charts/grid";
import { ChartTooltip } from "@/components/charts/tooltip/chart-tooltip";
import { XAxis } from "@/components/charts/x-axis";
import { ValueYAxis } from "@/components/charts/value-y-axis";
import { formatAxisValue } from "@/lib/views";
import { tooltipRows } from "./chart-tooltip-rows";
import { NotEnoughHistory } from "./not-enough-history";
import type { VisualizationProps } from "./types";

/** Bar Chart: one bar series per data point (or one when a formula is set). */
export function BarVisualization({ config, data }: VisualizationProps) {
  if (data.unavailable) return <NotEnoughHistory unavailable />;
  if (data.chartRows.length < 2) return <NotEnoughHistory />;

  return (
    <BarChart
      data={data.chartRows}
      xDataKey="date"
      aspectRatio="16 / 9"
      margin={{ top: 16, right: 16, bottom: 28, left: 44 }}
    >
      <Grid horizontal />
      {data.chartLines.map((line) => (
        <Bar key={line.key} dataKey={line.key} fill={line.color} />
      ))}
      <ValueYAxis format={(value) => formatAxisValue(value, config.yAxis)} />
      <XAxis />
      <ChartTooltip rows={tooltipRows(data.chartLines)} />
    </BarChart>
  );
}
