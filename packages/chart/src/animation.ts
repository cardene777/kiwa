import type { ChartNode } from './render.js';

export interface AnimationFrame {
  time: number;
  tree: ChartNode;
  interpolated: boolean;
}

export interface AnimateChartOptions {
  fromValues: number[];
  toValues: number[];
  frames?: number;
  easing?: 'linear' | 'ease-in-out';
}

/**
 * animation frame 列を生成、 fromValues → toValues を frames 数で補間。
 * real Recharts / Chart.js の animation stream を mock。
 */
export function animateChartFrames(build: (values: number[]) => ChartNode, opts: AnimateChartOptions): AnimationFrame[] {
  const frames = opts.frames ?? 10;
  const easing = opts.easing ?? 'linear';
  const from = opts.fromValues;
  const to = opts.toValues;
  const len = Math.max(from.length, to.length);
  const result: AnimationFrame[] = [];
  for (let i = 0; i <= frames; i += 1) {
    const t = frames === 0 ? 1 : i / frames;
    const eased = easing === 'ease-in-out' ? -0.5 * (Math.cos(Math.PI * t) - 1) : t;
    const values = Array.from({ length: len }, (_, k) => {
      const a = from[k] ?? 0;
      const b = to[k] ?? 0;
      return a + (b - a) * eased;
    });
    result.push({ time: t, tree: build(values), interpolated: i > 0 && i < frames });
  }
  return result;
}

export interface ResponsiveDimensions {
  width: number;
  height: number;
  breakpoint: 'mobile' | 'tablet' | 'desktop';
}

/**
 * viewport width から chart dimensions + breakpoint を導出。 responsive chart の
 * mock、 container width に応じて aspect ratio 調整。
 */
export function computeResponsiveDimensions(containerWidth: number, aspectRatio: number = 4 / 3): ResponsiveDimensions {
  const breakpoint: ResponsiveDimensions['breakpoint'] =
    containerWidth < 640 ? 'mobile' : containerWidth < 1024 ? 'tablet' : 'desktop';
  const width = Math.max(64, Math.floor(containerWidth));
  const height = Math.max(48, Math.floor(width / aspectRatio));
  return { width, height, breakpoint };
}
