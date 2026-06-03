"use client";

import { formatViewValue } from "@/lib/views";
import type { VisualizationProps } from "./types";

/** Big Number: the latest computed value with prefix/postfix, centered. */
export function NumberVisualization({ config, data }: VisualizationProps) {
  return (
    <div className="flex flex-1 items-center justify-center py-6">
      <p className="text-5xl font-bold tabular-nums">
        {formatViewValue(data.value, config)}
      </p>
    </div>
  );
}
