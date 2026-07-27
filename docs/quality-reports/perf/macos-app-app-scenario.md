# Perf Suite — macos-app-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | 0.05ms | 100ms | PASS | stable |
| a11y_batch (5 accessibility tree capture) | 0.01ms | 100ms | PASS | stable |
| notification_error_handling (5 empty title/body reject) | 0.00ms | 100ms | PASS | stable |
| retry_recovery (5 flaky async retry to success) | 0.04ms | 100ms | PASS | stable |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.02ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | 0.73ms | 200ms | PASS |
| a11y_batch (5 accessibility tree capture) | 0.03ms | 200ms | PASS |
| notification_error_handling (5 empty title/body reject) | 0.02ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.15ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | 9656 B | 30400 B | 102400 B | yes | PASS |
| a11y_batch (5 accessibility tree capture) | 4248 B | 0 B | 102400 B | yes | PASS |
| notification_error_handling (5 empty title/body reject) | -487064 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 12232 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 3064 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### user_flow_workflow (10 interaction+screencap cycle across modes)

# Perf Report — user_flow_workflow (10 interaction+screencap cycle across modes).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.05ms |
| p99 | 0.06ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.06ms |
| total | 0.68ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | +0.01ms | +26.04% |
| p95 | 0.05ms | 0.04ms | +0.00ms | +10.07% |
| p99 | 0.06ms | 0.04ms | +0.01ms | +31.97% |
| mean | 0.03ms | 0.03ms | +0.01ms | +28.95% |
| min | 0.02ms | 0.01ms | +0.00ms | +16.32% |
| max | 0.06ms | 0.04ms | +0.02ms | +37.31% |
| total | 0.68ms | 0.53ms | +0.15ms | +28.95% |

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
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +27.79% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +12.41% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +21.64% |
| mean | 0.00ms | 0.00ms | +0.00ms | +16.24% |
| min | 0.00ms | 0.00ms | +0.00ms | +1.16% |
| max | 0.01ms | 0.01ms | +0.00ms | +23.22% |
| total | 0.09ms | 0.08ms | +0.01ms | +16.24% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -9.13% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -7.84% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +2.33% |
| mean | 0.00ms | 0.00ms | -0.00ms | -8.57% |
| min | 0.00ms | 0.00ms | -0.00ms | -5.69% |
| max | 0.00ms | 0.00ms | +0.00ms | +3.69% |
| total | 0.03ms | 0.04ms | -0.00ms | -8.57% |

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
| total | 0.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | +0.00ms | +7.47% |
| p95 | 0.04ms | 0.04ms | +0.00ms | +3.60% |
| p99 | 0.04ms | 0.04ms | +0.00ms | +6.68% |
| mean | 0.03ms | 0.03ms | +0.00ms | +6.16% |
| min | 0.03ms | 0.03ms | +0.00ms | +6.75% |
| max | 0.04ms | 0.04ms | +0.00ms | +7.42% |
| total | 0.66ms | 0.62ms | +0.04ms | +6.16% |

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
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -14.36% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -14.09% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -15.82% |
| mean | 0.01ms | 0.01ms | -0.00ms | -14.22% |
| min | 0.01ms | 0.01ms | -0.00ms | -10.73% |
| max | 0.02ms | 0.02ms | -0.00ms | -16.22% |
| total | 0.22ms | 0.26ms | -0.04ms | -14.22% |

