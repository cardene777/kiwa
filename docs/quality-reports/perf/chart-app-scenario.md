# Perf Suite — chart-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 0.05ms | 0.08ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| axis_recompute_batch (5 dataset で computeAxis) | 0.06ms | 0.09ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| animation_frame_burst (5 series x 10 frames) | 0.04ms | 0.06ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| drilldown_batch (5 hit + 5 miss) | 0.0094ms | 0.03ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| export_batch (3 SVG + 3 PNG) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 0.20ms | 200ms | PASS |
| axis_recompute_batch (5 dataset で computeAxis) | 0.09ms | 200ms | PASS |
| animation_frame_burst (5 series x 10 frames) | 0.14ms | 200ms | PASS |
| drilldown_batch (5 hit + 5 miss) | 0.04ms | 200ms | PASS |
| export_batch (3 SVG + 3 PNG) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | -792 B | 0 B | 102400 B | yes | PASS |
| axis_recompute_batch (5 dataset で computeAxis) | 11272 B | 0 B | 102400 B | yes | PASS |
| animation_frame_burst (5 series x 10 frames) | 688 B | 0 B | 102400 B | yes | PASS |
| drilldown_batch (5 hit + 5 miss) | 3664 B | 0 B | 102400 B | yes | PASS |
| export_batch (3 SVG + 3 PNG) | -675264 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dashboard_render_workflow (10 chart across 4 kinds x 4 providers)

# Perf Report — dashboard_render_workflow (10 chart across 4 kinds x 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.06ms |
| p95 | 0.08ms |
| p99 | 0.08ms |
| mean | 0.06ms |
| stdev | 0.0094ms |
| min | 0.05ms |
| max | 0.08ms |
| total | 1.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.0063ms | -11.66% |
| p50 | 0.06ms | 0.06ms | -0.0021ms | -3.68% |
| p95 | 0.08ms | 0.08ms | -0.0023ms | -3.01% |
| p99 | 0.08ms | 0.09ms | -0.01ms | -13.32% |
| mean | 0.06ms | 0.06ms | -0.0041ms | -6.67% |
| min | 0.05ms | 0.05ms | -0.0035ms | -7.00% |
| max | 0.08ms | 0.09ms | -0.01ms | -15.49% |
| total | 1.15ms | 1.23ms | -0.08ms | -6.67% |

### axis_recompute_batch (5 dataset で computeAxis)

# Perf Report — axis_recompute_batch (5 dataset で computeAxis).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.06ms |
| p50 | 0.06ms |
| p95 | 0.09ms |
| p99 | 0.10ms |
| mean | 0.07ms |
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.10ms |
| total | 1.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.06ms | 0.02ms | +0.04ms | +208.61% |
| p50 | 0.06ms | 0.02ms | +0.04ms | +156.86% |
| p95 | 0.09ms | 0.03ms | +0.05ms | +169.08% |
| p99 | 0.10ms | 0.03ms | +0.06ms | +191.62% |
| mean | 0.07ms | 0.02ms | +0.04ms | +167.22% |
| min | 0.02ms | 0.02ms | +0.0059ms | +31.98% |
| max | 0.10ms | 0.03ms | +0.07ms | +196.85% |
| total | 1.33ms | 0.50ms | +0.83ms | +167.22% |

### animation_frame_burst (5 series x 10 frames)

# Perf Report — animation_frame_burst (5 series x 10 frames).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.05ms |
| p95 | 0.06ms |
| p99 | 0.06ms |
| mean | 0.05ms |
| stdev | 0.0067ms |
| min | 0.04ms |
| max | 0.07ms |
| total | 0.95ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.05ms | -0.0051ms | -10.98% |
| p50 | 0.05ms | 0.14ms | -0.09ms | -66.63% |
| p95 | 0.06ms | 0.27ms | -0.21ms | -78.11% |
| p99 | 0.06ms | 0.84ms | -0.77ms | -92.27% |
| mean | 0.05ms | 0.17ms | -0.12ms | -72.21% |
| min | 0.04ms | 0.04ms | -0.00092ms | -2.23% |
| max | 0.07ms | 0.98ms | -0.91ms | -93.23% |
| total | 0.95ms | 3.43ms | -2.48ms | -72.21% |

### drilldown_batch (5 hit + 5 miss)

# Perf Report — drilldown_batch (5 hit + 5 miss).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0094ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.05ms |
| mean | 0.02ms |
| stdev | 0.0094ms |
| min | 0.0080ms |
| max | 0.05ms |
| total | 0.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0094ms | 0.02ms | -0.01ms | -55.50% |
| p50 | 0.02ms | 0.04ms | -0.02ms | -58.09% |
| p95 | 0.03ms | 0.08ms | -0.05ms | -65.87% |
| p99 | 0.05ms | 0.11ms | -0.06ms | -55.67% |
| mean | 0.02ms | 0.04ms | -0.02ms | -54.94% |
| min | 0.0080ms | 0.02ms | -0.01ms | -61.09% |
| max | 0.05ms | 0.12ms | -0.06ms | -53.93% |
| total | 0.36ms | 0.80ms | -0.44ms | -54.94% |

### export_batch (3 SVG + 3 PNG)

# Perf Report — export_batch (3 SVG + 3 PNG).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0031ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.0012ms | -7.71% |
| p50 | 0.02ms | 0.02ms | -0.0013ms | -7.85% |
| p95 | 0.02ms | 0.03ms | -0.0022ms | -8.91% |
| p99 | 0.03ms | 0.03ms | -0.00082ms | -3.00% |
| mean | 0.02ms | 0.02ms | -0.0012ms | -6.65% |
| min | 0.01ms | 0.02ms | -0.0011ms | -7.07% |
| max | 0.03ms | 0.03ms | -0.00046ms | -1.66% |
| total | 0.34ms | 0.36ms | -0.02ms | -6.65% |

