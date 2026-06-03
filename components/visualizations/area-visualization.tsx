"use client";

import { Area, AreaChart } from "@/components/charts/area-chart";
import { chartCssVars } from "@/components/charts/chart-context";
import { Grid } from "@/components/charts/grid";
import { ChartTooltip } from "@/components/charts/tooltip/chart-tooltip";
import { XAxis } from "@/components/charts/x-axis";
import type { VisualizationProps } from "./types";
import { NotEnoughHistory } from "./not-enough-history";

/** Area Chart: the view's value over time with a filled region. */
export function AreaVisualization({ data }: VisualizationProps) {
  if (data.series.length < 2) return <NotEnoughHistory />;

  const chartData = data.series.map((point) => ({
    date: new Date(point.date),
    value: point.value,
  }));

  return (
    <AreaChart
      data={chartData}
      xDataKey="date"
      aspectRatio="16 / 9"
      margin={{ top: 16, right: 16, bottom: 28, left: 16 }}
    >
      <Grid horizontal />
      <Area
        dataKey="value"
        fill={chartCssVars.linePrimary}
        stroke={chartCssVars.linePrimary}
      />
      <XAxis />
      <ChartTooltip />
    </AreaChart>
  );
}
