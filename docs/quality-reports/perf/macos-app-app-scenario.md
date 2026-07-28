# Perf Suite — macos-app-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | 0.04ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1140%) 以上の悪化が必要) |
| a11y_batch (5 accessibility tree capture) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +6393%) 以上の悪化が必要) |
| notification_error_handling (5 empty title/body reject) | 0.00ms | 100ms | PASS | stable (差 0.01ms が下限 0.5ms 未満で判定を保留) |
| retry_recovery (5 flaky async retry to success) | 0.04ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1146%) 以上の悪化が必要) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +2476%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | 0.06ms | 200ms | PASS |
| a11y_batch (5 accessibility tree capture) | 0.02ms | 200ms | PASS |
| notification_error_handling (5 empty title/body reject) | 0.01ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.12ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | -1280 B | 0 B | 102400 B | yes | PASS |
| a11y_batch (5 accessibility tree capture) | 5144 B | 0 B | 102400 B | yes | PASS |
| notification_error_handling (5 empty title/body reject) | -13696 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 7128 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | -13416 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### user_flow_workflow (10 interaction+screencap cycle across modes)

# Perf Report — user_flow_workflow (10 interaction+screencap cycle across modes).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.05ms |
| total | 0.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +15.04% |
| p95 | 0.04ms | 0.04ms | -0.00ms | -6.96% |
| p99 | 0.05ms | 0.05ms | -0.01ms | -12.79% |
| mean | 0.02ms | 0.02ms | -0.00ms | -1.33% |
| min | 0.01ms | 0.01ms | -0.00ms | -2.16% |
| max | 0.05ms | 0.06ms | -0.01ms | -13.90% |
| total | 0.49ms | 0.50ms | -0.01ms | -1.33% |

### a11y_batch (5 accessibility tree capture)

# Perf Report — a11y_batch (5 accessibility tree capture).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -7.71% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -12.47% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -20.92% |
| mean | 0.00ms | 0.00ms | -0.00ms | -12.40% |
| min | 0.00ms | 0.00ms | -0.00ms | -14.30% |
| max | 0.01ms | 0.01ms | -0.00ms | -22.73% |
| total | 0.08ms | 0.09ms | -0.01ms | -12.40% |

### notification_error_handling (5 empty title/body reject)

# Perf Report — notification_error_handling (5 empty title/body reject).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.00ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -60.22% |
| p95 | 0.00ms | 0.01ms | -0.01ms | -78.33% |
| p99 | 0.00ms | 0.02ms | -0.02ms | -81.77% |
| mean | 0.00ms | 0.00ms | -0.00ms | -66.43% |
| min | 0.00ms | 0.00ms | -0.00ms | -59.75% |
| max | 0.00ms | 0.02ms | -0.02ms | -82.14% |
| total | 0.03ms | 0.10ms | -0.06ms | -66.43% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.00ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | -0.00ms | -9.15% |
| p95 | 0.04ms | 0.04ms | -0.01ms | -16.93% |
| p99 | 0.04ms | 0.05ms | -0.01ms | -14.86% |
| mean | 0.03ms | 0.03ms | -0.00ms | -13.42% |
| min | 0.03ms | 0.03ms | -0.00ms | -9.32% |
| max | 0.04ms | 0.05ms | -0.01ms | -14.43% |
| total | 0.59ms | 0.68ms | -0.09ms | -13.42% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -19.14% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -20.81% |
| p99 | 0.02ms | 0.02ms | -0.01ms | -28.66% |
| mean | 0.01ms | 0.01ms | -0.00ms | -24.35% |
| min | 0.01ms | 0.01ms | -0.00ms | -18.49% |
| max | 0.02ms | 0.02ms | -0.01ms | -30.31% |
| total | 0.21ms | 0.27ms | -0.07ms | -24.35% |

