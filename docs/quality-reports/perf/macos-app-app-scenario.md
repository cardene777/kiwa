# Perf Suite — macos-app-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | 0.01ms | 0.05ms | 100ms | 0.00050ms | PASS | stable (p10 +1% (閾値未満)、 p95 +21% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| a11y_batch (5 accessibility tree capture) | 0.0030ms | 0.0058ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| notification_error_handling (5 empty title/body reject) | 0.0014ms | 0.0040ms | 100ms | 0.00050ms | PASS | stable (p10 -3% (閾値未満)、 p95 +94% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.07ms | 100ms | 0.00050ms | PASS | stable (p10 +14% (閾値未満)、 p95 +85% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.0095ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | 0.09ms | 200ms | PASS |
| a11y_batch (5 accessibility tree capture) | 0.02ms | 200ms | PASS |
| notification_error_handling (5 empty title/body reject) | 0.01ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.13ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | -1008 B | 0 B | 102400 B | yes | PASS |
| a11y_batch (5 accessibility tree capture) | -1992 B | 0 B | 102400 B | yes | PASS |
| notification_error_handling (5 empty title/body reject) | 616 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 6712 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 7112 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### user_flow_workflow (10 interaction+screencap cycle across modes)

# Perf Report — user_flow_workflow (10 interaction+screencap cycle across modes).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.03ms |
| p95 | 0.05ms |
| p99 | 0.06ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.06ms |
| total | 0.56ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.000095ms | +0.67% |
| p50 | 0.03ms | 0.02ms | +0.0049ms | +19.60% |
| p95 | 0.05ms | 0.04ms | +0.0083ms | +20.63% |
| p99 | 0.06ms | 0.04ms | +0.02ms | +42.33% |
| mean | 0.03ms | 0.03ms | +0.0027ms | +10.87% |
| min | 0.01ms | 0.01ms | -0.000041ms | -0.29% |
| max | 0.06ms | 0.04ms | +0.02ms | +47.35% |
| total | 0.56ms | 0.50ms | +0.05ms | +10.87% |

### a11y_batch (5 accessibility tree capture)

# Perf Report — a11y_batch (5 accessibility tree capture).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0030ms |
| p50 | 0.0033ms |
| p95 | 0.0058ms |
| p99 | 0.0068ms |
| mean | 0.0039ms |
| stdev | 0.0011ms |
| min | 0.0030ms |
| max | 0.0070ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0030ms | 0.0030ms | -0.000042ms | -1.38% |
| p50 | 0.0033ms | 0.0031ms | +0.00011ms | +3.34% |
| p95 | 0.0058ms | 0.0061ms | -0.00030ms | -4.88% |
| p99 | 0.0068ms | 0.0065ms | +0.00027ms | +4.21% |
| mean | 0.0039ms | 0.0035ms | +0.00034ms | +9.53% |
| min | 0.0030ms | 0.0030ms | -0.000042ms | -1.40% |
| max | 0.0070ms | 0.0066ms | +0.00042ms | +6.29% |
| total | 0.08ms | 0.07ms | +0.0068ms | +9.53% |

### notification_error_handling (5 empty title/body reject)

# Perf Report — notification_error_handling (5 empty title/body reject).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0014ms |
| p50 | 0.0015ms |
| p95 | 0.0040ms |
| p99 | 0.0077ms |
| mean | 0.0020ms |
| stdev | 0.0017ms |
| min | 0.0014ms |
| max | 0.0086ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0014ms | 0.0014ms | -0.000041ms | -2.90% |
| p50 | 0.0015ms | 0.0014ms | +0.000021ms | +1.43% |
| p95 | 0.0040ms | 0.0021ms | +0.0019ms | +93.67% |
| p99 | 0.0077ms | 0.0036ms | +0.0041ms | +111.20% |
| mean | 0.0020ms | 0.0017ms | +0.00034ms | +20.67% |
| min | 0.0014ms | 0.0014ms | -0.000041ms | -2.90% |
| max | 0.0086ms | 0.0040ms | +0.0046ms | +113.44% |
| total | 0.04ms | 0.03ms | +0.0068ms | +20.67% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.07ms |
| p99 | 0.08ms |
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.08ms |
| total | 0.87ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.0036ms | +13.51% |
| p50 | 0.04ms | 0.03ms | +0.01ms | +40.18% |
| p95 | 0.07ms | 0.04ms | +0.03ms | +84.88% |
| p99 | 0.08ms | 0.04ms | +0.04ms | +108.83% |
| mean | 0.04ms | 0.03ms | +0.01ms | +49.07% |
| min | 0.03ms | 0.03ms | +0.0030ms | +11.32% |
| max | 0.08ms | 0.04ms | +0.05ms | +114.40% |
| total | 0.87ms | 0.58ms | +0.28ms | +49.07% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0095ms |
| p50 | 0.0099ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0021ms |
| min | 0.0095ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0095ms | 0.0095ms | +0.000079ms | +0.83% |
| p50 | 0.0099ms | 0.01ms | -0.00046ms | -4.43% |
| p95 | 0.02ms | 0.02ms | +0.0011ms | +6.98% |
| p99 | 0.02ms | 0.02ms | -0.0022ms | -11.71% |
| mean | 0.01ms | 0.01ms | -0.00050ms | -4.51% |
| min | 0.0095ms | 0.0094ms | +0.000043ms | +0.46% |
| max | 0.02ms | 0.02ms | -0.0030ms | -15.34% |
| total | 0.21ms | 0.22ms | -0.01ms | -4.51% |

