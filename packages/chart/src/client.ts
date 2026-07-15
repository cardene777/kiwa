import { renderChart, type ChartNode, type ChartSpec } from './render.js';
import { captureLegend, type LegendEntry } from './legend.js';
import { dispatchTooltip, type TooltipContent, type TooltipEvent } from './tooltip.js';

export type ChartProvider = 'recharts' | 'chartjs' | 'd3' | 'visx';

export interface RenderedChart {
  provider: ChartProvider;
  id: string;
  spec: ChartSpec;
  tree: ChartNode;
  renderedAt: number;
}

export interface ChartClient {
  provider: ChartProvider;
  renderChart: (spec: ChartSpec) => RenderedChart;
  captureLegend: (rendered: RenderedChart) => LegendEntry[];
  dispatchTooltip: (rendered: RenderedChart, event: TooltipEvent) => TooltipContent;
  listRendered: () => RenderedChart[];
  clear: () => void;
}

export interface CreateChartClientOptions {
  provider?: ChartProvider;
  now?: () => number;
  idSeed?: number;
}

/**
 * provider 別のみ id prefix + 属性 default を持たせる。 全 API 共通 interface で
 * Recharts / Chart.js / D3 / Visx を差し替え可能。
 */
export function createChartClient(options: CreateChartClientOptions = {}): ChartClient {
  const provider = options.provider ?? 'recharts';
  const now = options.now ?? (() => 0);
  const idPrefix = { recharts: 'rc', chartjs: 'cj', d3: 'd3', visx: 'vx' }[provider];
  const rendered: RenderedChart[] = [];
  let counter = options.idSeed ?? 0;

  return {
    provider,
    renderChart(spec: ChartSpec): RenderedChart {
      counter += 1;
      const id = `${idPrefix}-${counter}`;
      const tree = renderChart(spec);
      const record: RenderedChart = {
        provider,
        id,
        spec,
        tree,
        renderedAt: now(),
      };
      rendered.push(record);
      return record;
    },
    captureLegend(rendered: RenderedChart): LegendEntry[] {
      return captureLegend(rendered.tree);
    },
    dispatchTooltip(rendered: RenderedChart, event: TooltipEvent): TooltipContent {
      return dispatchTooltip(rendered.tree, event);
    },
    listRendered(): RenderedChart[] {
      return [...rendered];
    },
    clear(): void {
      rendered.length = 0;
    },
  };
}
