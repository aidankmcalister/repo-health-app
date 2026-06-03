"use client";

import { Bar } from "@/components/charts/bar";
import { BarChart } from "@/components/charts/bar-chart";
import { chartCssVars } from "@/components/charts/chart-context";
import { Grid } from "@/components/charts/grid";
import { ChartTooltip } from "@/components/charts/tooltip/chart-tooltip";
import { XAxis } from "@/components/charts/x-axis";
import type { VisualizationProps } from "./types";
import { NotEnoughHistory } from "./not-enough-history";

/** Bar Chart: the view's value over time as bars. */
export function BarVisualization({ data }: VisualizationProps) {
  if (data.series.length < 2) return <NotEnoughHistory />;

  const chartData = data.series.map((point) => ({
    date: new Date(point.date),
    value: point.value,
  }));

  return (
    <BarChart
      data={chartData}
      xDataKey="date"
      aspectRatio="16 / 9"
      margin={{ top: 16, right: 16, bottom: 28, left: 16 }}
    >
      <Grid horizontal />
      <Bar dataKey="value" fill={chartCssVars.linePrimary} />
      <XAxis />
      <ChartTooltip />
    </BarChart>
  );
}
