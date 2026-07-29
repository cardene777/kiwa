# Perf Suite — macos-app-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | 0.01ms | 0.04ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| a11y_batch (5 accessibility tree capture) | 0.0030ms | 0.0044ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| notification_error_handling (5 empty title/body reject) | 0.0014ms | 0.0020ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.07ms | 100ms | 0.00042ms | PASS | stable (p10 +2% (閾値未満)、 p95 +80% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.0098ms | 0.02ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | 0.07ms | 200ms | PASS |
| a11y_batch (5 accessibility tree capture) | 0.03ms | 200ms | PASS |
| notification_error_handling (5 empty title/body reject) | 0.01ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.30ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | 7176 B | 0 B | 102400 B | yes | PASS |
| a11y_batch (5 accessibility tree capture) | 1064 B | 0 B | 102400 B | yes | PASS |
| notification_error_handling (5 empty title/body reject) | 440 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | -253008 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 4496 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### user_flow_workflow (10 interaction+screencap cycle across modes)

# Perf Report — user_flow_workflow (10 interaction+screencap cycle across modes).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.05ms |
| total | 0.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00038ms | -2.67% |
| p50 | 0.03ms | 0.02ms | +0.0068ms | +27.42% |
| p95 | 0.04ms | 0.04ms | +0.00010ms | +0.26% |
| p99 | 0.05ms | 0.04ms | +0.0055ms | +12.87% |
| mean | 0.03ms | 0.03ms | +0.0026ms | +10.49% |
| min | 0.01ms | 0.01ms | -0.00021ms | -1.49% |
| max | 0.05ms | 0.04ms | +0.0068ms | +15.78% |
| total | 0.55ms | 0.50ms | +0.05ms | +10.49% |

### a11y_batch (5 accessibility tree capture)

# Perf Report — a11y_batch (5 accessibility tree capture).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0030ms |
| p50 | 0.0031ms |
| p95 | 0.0044ms |
| p99 | 0.0072ms |
| mean | 0.0035ms |
| stdev | 0.0011ms |
| min | 0.0030ms |
| max | 0.0079ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0030ms | 0.0030ms | -0.000042ms | -1.38% |
| p50 | 0.0031ms | 0.0031ms | -0.000041ms | -1.30% |
| p95 | 0.0044ms | 0.0061ms | -0.0016ms | -26.98% |
| p99 | 0.0072ms | 0.0065ms | +0.00071ms | +10.83% |
| mean | 0.0035ms | 0.0035ms | -0.000079ms | -2.24% |
| min | 0.0030ms | 0.0030ms | -0.000042ms | -1.40% |
| max | 0.0079ms | 0.0066ms | +0.0013ms | +19.49% |
| total | 0.07ms | 0.07ms | -0.0016ms | -2.24% |

### notification_error_handling (5 empty title/body reject)

# Perf Report — notification_error_handling (5 empty title/body reject).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0014ms |
| p50 | 0.0015ms |
| p95 | 0.0020ms |
| p99 | 0.0038ms |
| mean | 0.0017ms |
| stdev | 0.00063ms |
| min | 0.0014ms |
| max | 0.0042ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0014ms | 0.0014ms | -0.0000041ms | -0.29% |
| p50 | 0.0015ms | 0.0014ms | +0.000021ms | +1.46% |
| p95 | 0.0020ms | 0.0021ms | -0.000031ms | -1.48% |
| p99 | 0.0038ms | 0.0036ms | +0.00013ms | +3.50% |
| mean | 0.0017ms | 0.0017ms | +0.000015ms | +0.89% |
| min | 0.0014ms | 0.0014ms | -0.000041ms | -2.90% |
| max | 0.0042ms | 0.0040ms | +0.00017ms | +4.13% |
| total | 0.03ms | 0.03ms | +0.00029ms | +0.89% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.07ms |
| p99 | 0.08ms |
| mean | 0.04ms |
| stdev | 0.02ms |
| min | 0.03ms |
| max | 0.08ms |
| total | 0.72ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.00063ms | +2.32% |
| p50 | 0.03ms | 0.03ms | +0.00058ms | +2.08% |
| p95 | 0.07ms | 0.04ms | +0.03ms | +79.77% |
| p99 | 0.08ms | 0.04ms | +0.04ms | +102.63% |
| mean | 0.04ms | 0.03ms | +0.0071ms | +24.40% |
| min | 0.03ms | 0.03ms | +0.00063ms | +2.33% |
| max | 0.08ms | 0.04ms | +0.04ms | +107.94% |
| total | 0.72ms | 0.58ms | +0.14ms | +24.40% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0098ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0026ms |
| min | 0.0096ms |
| max | 0.02ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0098ms | 0.0095ms | +0.00037ms | +3.88% |
| p50 | 0.01ms | 0.01ms | +0.00015ms | +1.42% |
| p95 | 0.02ms | 0.02ms | +0.0018ms | +11.75% |
| p99 | 0.02ms | 0.02ms | +0.00020ms | +1.03% |
| mean | 0.01ms | 0.01ms | +0.00042ms | +3.76% |
| min | 0.0096ms | 0.0094ms | +0.00021ms | +2.22% |
| max | 0.02ms | 0.02ms | -0.00021ms | -1.05% |
| total | 0.23ms | 0.22ms | +0.0084ms | +3.76% |

