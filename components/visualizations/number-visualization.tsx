"use client";

import { formatViewValue } from "@/lib/views";
import type { VisualizationProps } from "./types";

/** Big Number: the latest computed value with prefix/postfix. */
export function NumberVisualization({ config, data }: VisualizationProps) {
  return (
    <p className="text-4xl font-bold tabular-nums">
      {formatViewValue(data.value, config)}
    </p>
  );
}
