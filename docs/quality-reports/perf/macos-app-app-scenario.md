# Perf Suite — macos-app-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | 0.01ms | 0.04ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| a11y_batch (5 accessibility tree capture) | 0.0079ms | 0.19ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| notification_error_handling (5 empty title/body reject) | 0.0014ms | 0.0032ms | 100ms | 0.00050ms | PASS | stable (p10 0% (閾値未満)、 p95 +56% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.04ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable (p10 +6% (閾値未満)、 p95 +32% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | 0.07ms | 200ms | PASS |
| a11y_batch (5 accessibility tree capture) | 0.66ms | 200ms | PASS |
| notification_error_handling (5 empty title/body reject) | 0.01ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.14ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | 4472 B | 0 B | 102400 B | yes | PASS |
| a11y_batch (5 accessibility tree capture) | -3440 B | 0 B | 102400 B | yes | PASS |
| notification_error_handling (5 empty title/body reject) | 1568 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 6712 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 6312 B | 0 B | 102400 B | yes | PASS |

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
| stdev | 0.0089ms |
| min | 0.01ms |
| max | 0.05ms |
| total | 0.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00045ms | +3.17% |
| p50 | 0.03ms | 0.02ms | +0.0039ms | +15.73% |
| p95 | 0.04ms | 0.04ms | -0.0036ms | -9.08% |
| p99 | 0.05ms | 0.04ms | +0.0031ms | +7.36% |
| mean | 0.03ms | 0.03ms | +0.0011ms | +4.30% |
| min | 0.01ms | 0.01ms | +0.00067ms | +4.79% |
| max | 0.05ms | 0.04ms | +0.0048ms | +11.16% |
| total | 0.52ms | 0.50ms | +0.02ms | +4.30% |

### a11y_batch (5 accessibility tree capture)

# Perf Report — a11y_batch (5 accessibility tree capture).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0079ms |
| p50 | 0.0091ms |
| p95 | 0.19ms |
| p99 | 0.43ms |
| mean | 0.05ms |
| stdev | 0.11ms |
| min | 0.0036ms |
| max | 0.49ms |
| total | 0.92ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0079ms | 0.0030ms | +0.0048ms | +158.88% |
| p50 | 0.0091ms | 0.0031ms | +0.0060ms | +190.10% |
| p95 | 0.19ms | 0.0061ms | +0.19ms | +3052.88% |
| p99 | 0.43ms | 0.0065ms | +0.43ms | +6542.63% |
| mean | 0.05ms | 0.0035ms | +0.04ms | +1197.46% |
| min | 0.0036ms | 0.0030ms | +0.00058ms | +19.43% |
| max | 0.49ms | 0.0066ms | +0.49ms | +7342.13% |
| total | 0.92ms | 0.07ms | +0.85ms | +1197.46% |

### notification_error_handling (5 empty title/body reject)

# Perf Report — notification_error_handling (5 empty title/body reject).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0014ms |
| p50 | 0.0015ms |
| p95 | 0.0032ms |
| p99 | 0.0045ms |
| mean | 0.0018ms |
| stdev | 0.00083ms |
| min | 0.0014ms |
| max | 0.0049ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0014ms | 0.0014ms | 0.00ms | 0.00% |
| p50 | 0.0015ms | 0.0014ms | +0.000022ms | +1.50% |
| p95 | 0.0032ms | 0.0021ms | +0.0012ms | +55.78% |
| p99 | 0.0045ms | 0.0036ms | +0.00090ms | +24.61% |
| mean | 0.0018ms | 0.0017ms | +0.00012ms | +7.06% |
| min | 0.0014ms | 0.0014ms | -0.000041ms | -2.90% |
| max | 0.0049ms | 0.0040ms | +0.00083ms | +20.64% |
| total | 0.04ms | 0.03ms | +0.0023ms | +7.06% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0042ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.00073ms | -2.70% |
| p50 | 0.03ms | 0.03ms | +0.0018ms | +6.52% |
| p95 | 0.04ms | 0.04ms | +0.0034ms | +9.32% |
| p99 | 0.04ms | 0.04ms | +0.0039ms | +10.18% |
| mean | 0.03ms | 0.03ms | +0.0019ms | +6.62% |
| min | 0.03ms | 0.03ms | -0.0014ms | -5.27% |
| max | 0.04ms | 0.04ms | +0.0041ms | +10.38% |
| total | 0.62ms | 0.58ms | +0.04ms | +6.62% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0034ms |
| min | 0.0096ms |
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0095ms | +0.00055ms | +5.80% |
| p50 | 0.01ms | 0.01ms | +0.00029ms | +2.83% |
| p95 | 0.02ms | 0.02ms | +0.0049ms | +32.02% |
| p99 | 0.02ms | 0.02ms | +0.0026ms | +13.83% |
| mean | 0.01ms | 0.01ms | +0.00095ms | +8.56% |
| min | 0.0096ms | 0.0094ms | +0.00021ms | +2.22% |
| max | 0.02ms | 0.02ms | +0.0020ms | +10.30% |
| total | 0.24ms | 0.22ms | +0.02ms | +8.56% |

