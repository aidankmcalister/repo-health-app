"use client";

import {
  VIEW_TYPE_AREA,
  VIEW_TYPE_BAR,
  VIEW_TYPE_LINE,
  type ViewConfig,
  type ViewData,
} from "@/lib/views";
import type { ReactNode } from "react";
import { AreaVisualization } from "./area-visualization";
import { BarVisualization } from "./bar-visualization";
import { LineVisualization } from "./line-visualization";
import { NumberVisualization } from "./number-visualization";
import type { VisualizationProps } from "./types";

// Map a view type to its renderer. Add a new chart by adding a case here.
const RENDERERS: Record<string, (props: VisualizationProps) => ReactNode> = {
  [VIEW_TYPE_LINE]: LineVisualization,
  [VIEW_TYPE_AREA]: AreaVisualization,
  [VIEW_TYPE_BAR]: BarVisualization,
};

/** Renders the right visualization for a view's type (defaults to Big Number). */
export function Visualization({
  type,
  config,
  data,
}: {
  type: string;
  config: ViewConfig;
  data: ViewData;
}) {
  const Renderer = RENDERERS[type] ?? NumberVisualization;
  return <Renderer config={config} data={data} />;
}
