import type { MeasureResult } from './types.js';

export function emitPerfReport(
  result: MeasureResult,
  opts: {
    baseline?: MeasureResult;
    includeSamples?: boolean;
  } = {},
): string {
  const lines: string[] = [];
  lines.push(`# Perf Report — ${result.name}`);
  lines.push('');
  lines.push('| metric | value |');
  lines.push('|---|---|');
  lines.push(`| iterations | ${result.iterations} |`);
  lines.push(`| warmup | ${result.warmup} |`);
  lines.push(`| p10 | ${formatMs(result.p10)} |`);
  lines.push(`| p50 | ${formatMs(result.p50)} |`);
  lines.push(`| p95 | ${formatMs(result.p95)} |`);
  lines.push(`| p99 | ${formatMs(result.p99)} |`);
  lines.push(`| mean | ${formatMs(result.mean)} |`);
  lines.push(`| stdev | ${formatMs(result.stdev)} |`);
  lines.push(`| min | ${formatMs(result.minMs)} |`);
  lines.push(`| max | ${formatMs(result.maxMs)} |`);
  lines.push(`| total | ${formatMs(result.totalMs)} |`);
  lines.push('');

  if (opts.baseline) {
    const metrics = [
      { label: 'p10', current: result.p10, baseline: opts.baseline.p10 },
      { label: 'p50', current: result.p50, baseline: opts.baseline.p50 },
      { label: 'p95', current: result.p95, baseline: opts.baseline.p95 },
      { label: 'p99', current: result.p99, baseline: opts.baseline.p99 },
      { label: 'mean', current: result.mean, baseline: opts.baseline.mean },
      { label: 'min', current: result.minMs, baseline: opts.baseline.minMs },
      { label: 'max', current: result.maxMs, baseline: opts.baseline.maxMs },
      { label: 'total', current: result.totalMs, baseline: opts.baseline.totalMs },
    ];
    lines.push('## Baseline diff');
    lines.push('');
    lines.push('| metric | current | baseline | delta ms | delta % |');
    lines.push('|---|---|---|---|---|');
    for (const metric of metrics) {
      const deltaMs = metric.current - metric.baseline;
      const deltaPct = metric.baseline === 0 ? 0 : (deltaMs / metric.baseline) * 100;
      lines.push(
        `| ${metric.label} | ${formatMs(metric.current)} | ${formatMs(metric.baseline)} | ${formatSignedMs(deltaMs)} | ${formatSignedPct(deltaPct)} |`,
      );
    }
    lines.push('');
  }

  if (opts.includeSamples) {
    lines.push('## Samples histogram');
    lines.push('');
    lines.push('| bin | range ms | count | bar |');
    lines.push('|---|---|---|---|');
    for (const row of histogramRows(result.samples, 10)) {
      lines.push(`| ${row.index} | ${row.range} | ${row.count} | ${row.bar} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function histogramRows(samples: number[], bins: number): Array<{
  index: number;
  range: string;
  count: number;
  bar: string;
}> {
  if (samples.length === 0) {
    return [];
  }

  const min = Math.min(...samples);
  const max = Math.max(...samples);
  const width = max === min ? 1 : (max - min) / bins;
  const counts = new Array<number>(bins).fill(0);

  for (const sample of samples) {
    const rawIndex = width === 0 ? 0 : Math.floor((sample - min) / width);
    const index = Math.min(bins - 1, Math.max(0, rawIndex));
    counts[index] = (counts[index] ?? 0) + 1;
  }

  const peak = Math.max(...counts, 1);
  return counts.map((count, index) => {
    const start = min + (index * width);
    const end = index === bins - 1 ? max : start + width;
    return {
      index: index + 1,
      range: `${start.toFixed(2)}-${end.toFixed(2)}`,
      count,
      bar: '#'.repeat(count === 0 ? 0 : Math.max(1, Math.round((count / peak) * 10))),
    };
  });
}

/**
 * 1ms を大きく下回る値も読める形に整える。
 *
 * 小数 2 桁の固定だと、 sub-ms の op は p10 も p95 も差も全部 `0.00ms` になる。
 * 回帰判定が読む軸が p10 に移って、 その帯の値が報告の主役になった。
 */
export function formatMs(value: number): string {
  if (value === 0) return '0.00ms';
  if (Math.abs(value) >= 0.01) return `${value.toFixed(2)}ms`;
  return `${value.toPrecision(2)}ms`;
}

function formatSignedMs(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatMs(value)}`;
}

function formatSignedPct(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}
