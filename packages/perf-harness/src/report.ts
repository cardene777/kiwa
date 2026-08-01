import type { MeasureResult } from './types.js';

export function emitPerfReport(
  result: MeasureResult,
  opts: {
    baseline?: MeasureResult;
    includeSamples?: boolean;
    /**
     * 今回の値を baseline を測った時の機械の速さへ換算する倍率
     * (`RegressionResult.normalizationScale`)。 既定 1 = 換算しない。
     *
     * 渡さないと、 この表だけが実測値どうしを比べることになる。 回帰判定は換算後の
     * 値を読むため、 同じ report の中で verdict が `regressed` の行に改善を示す
     * 差分が並ぶ (実測 +15.6% / 換算後 +23% のように符号ごと食い違う場合がある)。
     */
    normalizationScale?: number;
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
    // 換算を掛けないと、 この表だけが実測値どうしを比べることになり、 回帰判定が
    // 読む量と食い違う。 倍率は全 metric に同じだけ掛かる (今回の測定を baseline を
    // 測った時の機械の速さへ置き換える操作なので、 分位ごとに変わらない)。
    const scale =
      opts.normalizationScale !== undefined && Number.isFinite(opts.normalizationScale)
        ? opts.normalizationScale
        : 1;
    const metrics = [
      { label: 'p10', current: result.p10 * scale, baseline: opts.baseline.p10 },
      { label: 'p50', current: result.p50 * scale, baseline: opts.baseline.p50 },
      { label: 'p95', current: result.p95 * scale, baseline: opts.baseline.p95 },
      { label: 'p99', current: result.p99 * scale, baseline: opts.baseline.p99 },
      { label: 'mean', current: result.mean * scale, baseline: opts.baseline.mean },
      { label: 'min', current: result.minMs * scale, baseline: opts.baseline.minMs },
      { label: 'max', current: result.maxMs * scale, baseline: opts.baseline.maxMs },
      { label: 'total', current: result.totalMs * scale, baseline: opts.baseline.totalMs },
    ];
    lines.push('## Baseline diff');
    lines.push('');
    if (scale !== 1) {
      lines.push(
        `current は baseline を測った時の機械の速さへ換算済み (倍率 ${scale.toFixed(3)})。 回帰判定が読む量と同じ。 実測値は上表。`,
      );
      lines.push('');
    }
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

/**
 * memory 測定で `fn` を呼んだ回数を 1 セルにする。
 *
 * 空回しは測定区間の外で呼ぶため、 副作用や件数依存を持つ op では同じ
 * `iterations` でも空回しの有無で測っているものが変わる。 表の見出しは反復数しか
 * 出さないので、 実際の総呼出数をここで明示する (#1730)。
 *
 * 空回しが無い実行では反復数だけを出す。 `0 + 20 = 20` は読み手に何も足さない。
 */
export function formatMemoryCalls(sample: {
  warmupCount?: number;
  iterationCount: number;
  totalCallCount?: number;
}): string {
  const warmup = sample.warmupCount ?? 0;
  const total = sample.totalCallCount ?? warmup + sample.iterationCount;
  if (warmup === 0) return `${total}`;
  return `${total} (${warmup} + ${sample.iterationCount})`;
}

function formatSignedMs(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatMs(value)}`;
}

function formatSignedPct(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}
