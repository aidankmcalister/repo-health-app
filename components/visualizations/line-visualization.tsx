"use client";

import { chartCssVars } from "@/components/charts/chart-context";
import { Grid } from "@/components/charts/grid";
import { Line, LineChart } from "@/components/charts/line-chart";
import { ChartTooltip } from "@/components/charts/tooltip/chart-tooltip";
import { XAxis } from "@/components/charts/x-axis";
import { NotEnoughHistory } from "./not-enough-history";
import type { VisualizationProps } from "./types";

/** Line Chart: the view's value over time, from its snapshot history. */
export function LineVisualization({ data }: VisualizationProps) {
  if (data.series.length < 2) return <NotEnoughHistory />;

  const chartData = data.series.map((point) => ({
    date: new Date(point.date),
    value: point.value,
  }));

  return (
    <LineChart
      data={chartData}
      xDataKey="date"
      aspectRatio="16 / 9"
      margin={{ top: 16, right: 16, bottom: 28, left: 16 }}
    >
      <Grid horizontal />
      <Line dataKey="value" stroke={chartCssVars.linePrimary} />
      <XAxis />
      <ChartTooltip />
    </LineChart>
  );
}
