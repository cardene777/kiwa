# Perf Suite — design-check-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | 0.14ms | 0.66ms | 100ms | 0.00042ms | PASS | stable (p10 +3% (閾値未満)、 p95 +60% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| large_spec_conformance (spec 80 keys × 5 iter) | 0.03ms | 0.04ms | 50ms | 0.00042ms | PASS | regressed — gate 無効 (regressionGate=false) |
| regression_scan_burst (50 element layout × 10 iter) | 0.05ms | 0.11ms | 50ms | 0.00042ms | PASS | stable (p10 +1% (閾値未満)、 p95 +120% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | 2.46ms | 200ms | PASS |
| large_spec_conformance (spec 80 keys × 5 iter) | 0.27ms | 100ms | PASS |
| regression_scan_burst (50 element layout × 10 iter) | 0.47ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | -31640 B | -935 B | 102400 B | yes | PASS |
| large_spec_conformance (spec 80 keys × 5 iter) | 1168 B | 0 B | 102400 B | yes | PASS |
| regression_scan_burst (50 element layout × 10 iter) | -3400 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### full_design_audit (spec + layout combined 10 iter)

# Perf Report — full_design_audit (spec + layout combined 10 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.14ms |
| p50 | 0.15ms |
| p95 | 0.66ms |
| p99 | 1.36ms |
| mean | 0.27ms |
| stdev | 0.30ms |
| min | 0.12ms |
| max | 1.62ms |
| total | 8.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.14ms | 0.14ms | +0.0037ms | +2.64% |
| p50 | 0.15ms | 0.15ms | -0.0034ms | -2.31% |
| p95 | 0.66ms | 0.41ms | +0.25ms | +59.68% |
| p99 | 1.36ms | 0.44ms | +0.91ms | +206.65% |
| mean | 0.27ms | 0.20ms | +0.06ms | +30.84% |
| min | 0.12ms | 0.11ms | +0.01ms | +10.87% |
| max | 1.62ms | 0.45ms | +1.17ms | +258.86% |
| total | 8.04ms | 6.15ms | +1.90ms | +30.84% |

### large_spec_conformance (spec 80 keys × 5 iter)

# Perf Report — large_spec_conformance (spec 80 keys × 5 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.0034ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 0.96ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.02ms | +0.0072ms | +30.91% |
| p50 | 0.03ms | 0.02ms | +0.0077ms | +32.65% |
| p95 | 0.04ms | 0.02ms | +0.01ms | +46.46% |
| p99 | 0.05ms | 0.03ms | +0.02ms | +74.46% |
| mean | 0.03ms | 0.02ms | +0.0084ms | +35.35% |
| min | 0.03ms | 0.02ms | +0.0059ms | +25.45% |
| max | 0.05ms | 0.03ms | +0.02ms | +82.97% |
| total | 0.96ms | 0.71ms | +0.25ms | +35.35% |

### regression_scan_burst (50 element layout × 10 iter)

# Perf Report — regression_scan_burst (50 element layout × 10 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.05ms |
| p50 | 0.05ms |
| p95 | 0.11ms |
| p99 | 0.17ms |
| mean | 0.06ms |
| stdev | 0.03ms |
| min | 0.05ms |
| max | 0.17ms |
| total | 1.73ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | +0.00055ms | +1.13% |
| p50 | 0.05ms | 0.05ms | +0.00038ms | +0.76% |
| p95 | 0.11ms | 0.05ms | +0.06ms | +120.20% |
| p99 | 0.17ms | 0.05ms | +0.12ms | +227.75% |
| mean | 0.06ms | 0.05ms | +0.0082ms | +16.70% |
| min | 0.05ms | 0.05ms | +0.00063ms | +1.31% |
| max | 0.17ms | 0.05ms | +0.12ms | +239.00% |
| total | 1.73ms | 1.48ms | +0.25ms | +16.70% |

