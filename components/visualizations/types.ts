import type { ViewConfig, ViewData } from "@/lib/views";

// Every visualization renderer takes the view's config and prepared data.
export type VisualizationProps = {
  config: ViewConfig;
  data: ViewData;
};
