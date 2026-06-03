"use client";

import { Grid } from "@/components/charts/grid";
import { Line, LineChart } from "@/components/charts/line-chart";
import { ChartTooltip } from "@/components/charts/tooltip/chart-tooltip";
import { XAxis } from "@/components/charts/x-axis";
import { ValueYAxis } from "@/components/charts/value-y-axis";
import { formatAxisValue } from "@/lib/views";
import { tooltipRows } from "./chart-tooltip-rows";
import { NotEnoughHistory } from "./not-enough-history";
import type { VisualizationProps } from "./types";

/** Line Chart: one line per data point (or a single line when a formula is set). */
export function LineVisualization({ config, data }: VisualizationProps) {
  if (data.chartRows.length < 2) return <NotEnoughHistory />;

  return (
    <LineChart
      data={data.chartRows}
      xDataKey="date"
      aspectRatio="16 / 9"
      margin={{ top: 16, right: 16, bottom: 28, left: 44 }}
    >
      <Grid horizontal />
      {data.chartLines.map((line) => (
        <Line key={line.key} dataKey={line.key} stroke={line.color} />
      ))}
      <ValueYAxis format={(value) => formatAxisValue(value, config.yAxis)} />
      <XAxis />
      <ChartTooltip rows={tooltipRows(data.chartLines)} />
    </LineChart>
  );
}
