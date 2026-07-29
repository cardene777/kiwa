# Perf Suite — chart-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 0.06ms | 0.12ms | 100ms | 0.00042ms | PASS | stable (p10 +4% (閾値未満)、 p95 +51% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| axis_recompute_batch (5 dataset で computeAxis) | 0.02ms | 0.03ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| animation_frame_burst (5 series x 10 frames) | 0.03ms | 0.06ms | 100ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| drilldown_batch (5 hit + 5 miss) | 0.0083ms | 0.04ms | 100ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| export_batch (3 SVG + 3 PNG) | 0.01ms | 0.03ms | 100ms | 0.00042ms | PASS | stable (p10 -13% (閾値未満)、 p95 +22% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 0.19ms | 200ms | PASS |
| axis_recompute_batch (5 dataset で computeAxis) | 0.09ms | 200ms | PASS |
| animation_frame_burst (5 series x 10 frames) | 0.15ms | 200ms | PASS |
| drilldown_batch (5 hit + 5 miss) | 0.05ms | 200ms | PASS |
| export_batch (3 SVG + 3 PNG) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 1024 B | 0 B | 102400 B | yes | PASS |
| axis_recompute_batch (5 dataset で computeAxis) | -464 B | 0 B | 102400 B | yes | PASS |
| animation_frame_burst (5 series x 10 frames) | 480 B | 0 B | 102400 B | yes | PASS |
| drilldown_batch (5 hit + 5 miss) | 23648 B | 0 B | 102400 B | yes | PASS |
| export_batch (3 SVG + 3 PNG) | -280640 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dashboard_render_workflow (10 chart across 4 kinds x 4 providers)

# Perf Report — dashboard_render_workflow (10 chart across 4 kinds x 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.06ms |
| p50 | 0.06ms |
| p95 | 0.12ms |
| p99 | 0.12ms |
| mean | 0.07ms |
| stdev | 0.02ms |
| min | 0.04ms |
| max | 0.13ms |
| total | 1.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.06ms | 0.05ms | +0.0021ms | +3.98% |
| p50 | 0.06ms | 0.06ms | +0.0028ms | +4.88% |
| p95 | 0.12ms | 0.08ms | +0.04ms | +50.88% |
| p99 | 0.12ms | 0.09ms | +0.04ms | +40.01% |
| mean | 0.07ms | 0.06ms | +0.0058ms | +9.34% |
| min | 0.04ms | 0.05ms | -0.0077ms | -15.70% |
| max | 0.13ms | 0.09ms | +0.03ms | +37.71% |
| total | 1.35ms | 1.23ms | +0.12ms | +9.34% |

### axis_recompute_batch (5 dataset で computeAxis)

# Perf Report — axis_recompute_batch (5 dataset で computeAxis).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.0047ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.0015ms | +8.28% |
| p50 | 0.02ms | 0.02ms | -0.00094ms | -3.91% |
| p95 | 0.03ms | 0.03ms | -0.00043ms | -1.35% |
| p99 | 0.04ms | 0.03ms | +0.0012ms | +3.68% |
| mean | 0.02ms | 0.02ms | -0.000046ms | -0.18% |
| min | 0.02ms | 0.02ms | +0.00083ms | +4.50% |
| max | 0.04ms | 0.03ms | +0.0017ms | +4.84% |
| total | 0.50ms | 0.50ms | -0.00092ms | -0.18% |

### animation_frame_burst (5 series x 10 frames)

# Perf Report — animation_frame_burst (5 series x 10 frames).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.06ms |
| p99 | 0.06ms |
| mean | 0.04ms |
| stdev | 0.0097ms |
| min | 0.03ms |
| max | 0.06ms |
| total | 0.88ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.05ms | -0.01ms | -25.83% |
| p50 | 0.04ms | 0.14ms | -0.10ms | -69.58% |
| p95 | 0.06ms | 0.27ms | -0.21ms | -77.23% |
| p99 | 0.06ms | 0.84ms | -0.77ms | -92.36% |
| mean | 0.04ms | 0.17ms | -0.13ms | -74.46% |
| min | 0.03ms | 0.04ms | -0.0076ms | -18.50% |
| max | 0.06ms | 0.98ms | -0.91ms | -93.39% |
| total | 0.88ms | 3.43ms | -2.56ms | -74.46% |

### drilldown_batch (5 hit + 5 miss)

# Perf Report — drilldown_batch (5 hit + 5 miss).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0083ms |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.0083ms |
| max | 0.06ms |
| total | 0.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0083ms | 0.02ms | -0.01ms | -60.56% |
| p50 | 0.02ms | 0.04ms | -0.02ms | -56.75% |
| p95 | 0.04ms | 0.08ms | -0.04ms | -54.10% |
| p99 | 0.05ms | 0.11ms | -0.06ms | -50.86% |
| mean | 0.02ms | 0.04ms | -0.02ms | -57.00% |
| min | 0.0083ms | 0.02ms | -0.01ms | -60.08% |
| max | 0.06ms | 0.12ms | -0.06ms | -50.30% |
| total | 0.34ms | 0.80ms | -0.45ms | -57.00% |

### export_batch (3 SVG + 3 PNG)

# Perf Report — export_batch (3 SVG + 3 PNG).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0053ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.0021ms | -13.16% |
| p50 | 0.02ms | 0.02ms | -0.0016ms | -9.71% |
| p95 | 0.03ms | 0.03ms | +0.0056ms | +22.37% |
| p99 | 0.03ms | 0.03ms | +0.0043ms | +15.80% |
| mean | 0.02ms | 0.02ms | -0.00053ms | -2.97% |
| min | 0.01ms | 0.02ms | -0.0021ms | -13.09% |
| max | 0.03ms | 0.03ms | +0.0040ms | +14.31% |
| total | 0.35ms | 0.36ms | -0.01ms | -2.97% |

