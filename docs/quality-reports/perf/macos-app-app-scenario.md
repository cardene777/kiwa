# Perf Suite — macos-app-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | 0.04ms | 100ms | PASS | stable |
| a11y_batch (5 accessibility tree capture) | 0.01ms | 100ms | PASS | stable |
| notification_error_handling (5 empty title/body reject) | 0.00ms | 100ms | PASS | stable |
| retry_recovery (5 flaky async retry to success) | 0.04ms | 100ms | PASS | stable |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.02ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | 0.08ms | 200ms | PASS |
| a11y_batch (5 accessibility tree capture) | 0.02ms | 200ms | PASS |
| notification_error_handling (5 empty title/body reject) | 0.01ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.12ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | -2176 B | 0 B | 102400 B | yes | PASS |
| a11y_batch (5 accessibility tree capture) | -2328 B | 0 B | 102400 B | yes | PASS |
| notification_error_handling (5 empty title/body reject) | 624 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 11152 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | -160 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### user_flow_workflow (10 interaction+screencap cycle across modes)

# Perf Report — user_flow_workflow (10 interaction+screencap cycle across modes).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | +0.00ms | +0.55% |
| p95 | 0.04ms | 0.04ms | -0.00ms | -3.72% |
| p99 | 0.04ms | 0.04ms | -0.00ms | -1.81% |
| mean | 0.03ms | 0.03ms | -0.00ms | -3.67% |
| min | 0.01ms | 0.01ms | -0.00ms | -3.55% |
| max | 0.04ms | 0.04ms | -0.00ms | -1.35% |
| total | 0.51ms | 0.53ms | -0.02ms | -3.67% |

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
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -8.33% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +21.04% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -10.59% |
| mean | 0.00ms | 0.00ms | -0.00ms | -7.75% |
| min | 0.00ms | 0.00ms | -0.00ms | -24.14% |
| max | 0.01ms | 0.01ms | -0.00ms | -16.01% |
| total | 0.07ms | 0.08ms | -0.01ms | -7.75% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -11.69% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +17.12% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -7.79% |
| mean | 0.00ms | 0.00ms | -0.00ms | -8.34% |
| min | 0.00ms | 0.00ms | -0.00ms | -5.69% |
| max | 0.00ms | 0.00ms | -0.00ms | -11.11% |
| total | 0.03ms | 0.04ms | -0.00ms | -8.34% |

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
| total | 0.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | +0.00ms | +3.81% |
| p95 | 0.04ms | 0.04ms | +0.00ms | +0.79% |
| p99 | 0.04ms | 0.04ms | +0.00ms | +2.41% |
| mean | 0.03ms | 0.03ms | +0.00ms | +2.13% |
| min | 0.03ms | 0.03ms | -0.00ms | -1.86% |
| max | 0.04ms | 0.04ms | +0.00ms | +2.80% |
| total | 0.64ms | 0.62ms | +0.01ms | +2.13% |

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
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -14.18% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -3.27% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -8.13% |
| mean | 0.01ms | 0.01ms | -0.00ms | -10.00% |
| min | 0.01ms | 0.01ms | -0.00ms | -11.88% |
| max | 0.02ms | 0.02ms | -0.00ms | -9.24% |
| total | 0.23ms | 0.26ms | -0.03ms | -10.00% |

