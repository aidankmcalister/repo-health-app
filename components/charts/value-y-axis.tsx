"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useChart, useChartStable } from "./chart-context";

function formatTick(value: number): string {
  if (Number.isInteger(value)) return value.toLocaleString();
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

type Formatter = (value: number) => string;

/** Numeric y-axis tick labels for line/area/bar charts (mirrors XAxis). */
export function ValueYAxis({
  numTicks = 4,
  format,
}: {
  numTicks?: number;
  format?: Formatter;
}) {
  const { containerRef } = useChartStable();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const container = containerRef.current;
  if (!(mounted && container)) return null;

  return (
    <ValueYAxisInner numTicks={numTicks} format={format} container={container} />
  );
}

const ValueYAxisInner = memo(function ValueYAxisInner({
  numTicks,
  format,
  container,
}: {
  numTicks: number;
  format?: Formatter;
  container: HTMLDivElement;
}) {
  const { yScale, margin } = useChart();

  const ticks = useMemo(() => {
    const [min, max] = yScale.domain();
    const count = Math.max(2, numTicks);
    const out: { value: number; y: number }[] = [];
    for (let i = 0; i < count; i++) {
      const value = min + ((max - min) * i) / (count - 1);
      out.push({ value, y: (yScale(value) ?? 0) + margin.top });
    }
    return out;
  }, [yScale, margin.top, numTicks]);

  return createPortal(
    <div className="pointer-events-none absolute inset-0">
      {ticks.map(({ value, y }) => (
        <span
          key={value}
          className="absolute -translate-y-1/2 text-xs text-chart-label"
          style={{ left: 4, top: y }}
        >
          {format ? format(value) : formatTick(value)}
        </span>
      ))}
    </div>,
    container,
  );
});

ValueYAxis.displayName = "ValueYAxis";
