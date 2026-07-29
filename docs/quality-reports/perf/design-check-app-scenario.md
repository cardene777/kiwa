# Perf Suite — design-check-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | 0.11ms | 0.50ms | 100ms | 0.00042ms | PASS | stable (p10 -20% (閾値未満)、 p95 +20% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| large_spec_conformance (spec 80 keys × 5 iter) | 0.03ms | 0.05ms | 50ms | 0.00042ms | PASS | regressed — gate 無効 (regressionGate=false) |
| regression_scan_burst (50 element layout × 10 iter) | 0.05ms | 0.06ms | 50ms | 0.00042ms | PASS | stable (p10 +2% (閾値未満)、 p95 +28% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | 1.36ms | 200ms | PASS |
| large_spec_conformance (spec 80 keys × 5 iter) | 0.16ms | 100ms | PASS |
| regression_scan_burst (50 element layout × 10 iter) | 0.24ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | -32584 B | 0 B | 102400 B | yes | PASS |
| large_spec_conformance (spec 80 keys × 5 iter) | -824 B | 0 B | 102400 B | yes | PASS |
| regression_scan_burst (50 element layout × 10 iter) | 344 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### full_design_audit (spec + layout combined 10 iter)

# Perf Report — full_design_audit (spec + layout combined 10 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.11ms |
| p50 | 0.16ms |
| p95 | 0.50ms |
| p99 | 0.72ms |
| mean | 0.21ms |
| stdev | 0.15ms |
| min | 0.11ms |
| max | 0.79ms |
| total | 6.43ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.11ms | 0.14ms | -0.03ms | -19.74% |
| p50 | 0.16ms | 0.15ms | +0.0071ms | +4.77% |
| p95 | 0.50ms | 0.41ms | +0.08ms | +20.38% |
| p99 | 0.72ms | 0.44ms | +0.28ms | +62.28% |
| mean | 0.21ms | 0.20ms | +0.0093ms | +4.54% |
| min | 0.11ms | 0.11ms | +0.0000010ms | +0.00% |
| max | 0.79ms | 0.45ms | +0.34ms | +75.30% |
| total | 6.43ms | 6.15ms | +0.28ms | +4.54% |

### large_spec_conformance (spec 80 keys × 5 iter)

# Perf Report — large_spec_conformance (spec 80 keys × 5 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.05ms |
| p99 | 0.08ms |
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.09ms |
| total | 1.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.02ms | +0.01ms | +43.78% |
| p50 | 0.03ms | 0.02ms | +0.01ms | +47.47% |
| p95 | 0.05ms | 0.02ms | +0.03ms | +116.52% |
| p99 | 0.08ms | 0.03ms | +0.05ms | +199.47% |
| mean | 0.04ms | 0.02ms | +0.01ms | +61.32% |
| min | 0.03ms | 0.02ms | +0.0091ms | +39.54% |
| max | 0.09ms | 0.03ms | +0.06ms | +230.74% |
| total | 1.15ms | 0.71ms | +0.44ms | +61.32% |

### regression_scan_burst (50 element layout × 10 iter)

# Perf Report — regression_scan_burst (50 element layout × 10 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.05ms |
| p50 | 0.05ms |
| p95 | 0.06ms |
| p99 | 0.07ms |
| mean | 0.05ms |
| stdev | 0.0057ms |
| min | 0.05ms |
| max | 0.07ms |
| total | 1.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | +0.0011ms | +2.34% |
| p50 | 0.05ms | 0.05ms | +0.0034ms | +6.90% |
| p95 | 0.06ms | 0.05ms | +0.01ms | +28.33% |
| p99 | 0.07ms | 0.05ms | +0.02ms | +43.76% |
| mean | 0.05ms | 0.05ms | +0.0046ms | +9.40% |
| min | 0.05ms | 0.05ms | +0.0013ms | +2.79% |
| max | 0.07ms | 0.05ms | +0.02ms | +45.39% |
| total | 1.62ms | 1.48ms | +0.14ms | +9.40% |

