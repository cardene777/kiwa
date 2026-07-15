export {
  createChartClient,
  type ChartProvider,
  type ChartClient,
  type RenderedChart,
} from './client.js';

export {
  renderChart,
  type ChartKind,
  type ChartSpec,
  type ChartSeries,
  type ChartDataPoint,
  type ChartNode,
} from './render.js';

export {
  computeAxis,
  type AxisResult,
  type AxisOptions,
} from './axis.js';

export {
  captureLegend,
  type LegendEntry,
} from './legend.js';

export {
  dispatchTooltip,
  type TooltipEvent,
  type TooltipContent,
} from './tooltip.js';

export {
  animateChartFrames,
  computeResponsiveDimensions,
  type AnimationFrame,
  type AnimateChartOptions,
  type ResponsiveDimensions,
} from './animation.js';

export {
  drillDown,
  exportChart,
  type DrillDownRequest,
  type DrillDownResult,
  type ExportOptions,
} from './drilldown.js';

export {
  withObservability,
  type RenderMetric,
  type ObservabilityHook,
} from './observability.js';
