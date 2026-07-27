# Perf Suite — macos-app-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | 0.05ms | 100ms | PASS | stable |
| a11y_batch (5 accessibility tree capture) | 0.01ms | 100ms | PASS | stable |
| notification_error_handling (5 empty title/body reject) | 0.00ms | 100ms | PASS | stable |
| retry_recovery (5 flaky async retry to success) | 0.08ms | 100ms | PASS | stable |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.02ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | 0.07ms | 200ms | PASS |
| a11y_batch (5 accessibility tree capture) | 0.02ms | 200ms | PASS |
| notification_error_handling (5 empty title/body reject) | 0.01ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.13ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | -568 B | -27512 B | 102400 B | yes | PASS |
| a11y_batch (5 accessibility tree capture) | 5960 B | 0 B | 102400 B | yes | PASS |
| notification_error_handling (5 empty title/body reject) | 1672 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 10960 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 1296 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### user_flow_workflow (10 interaction+screencap cycle across modes)

# Perf Report — user_flow_workflow (10 interaction+screencap cycle across modes).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.05ms |
| p99 | 0.10ms |
| mean | 0.03ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.11ms |
| total | 0.63ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | +0.00ms | +4.15% |
| p95 | 0.05ms | 0.04ms | +0.01ms | +25.99% |
| p99 | 0.10ms | 0.04ms | +0.05ms | +125.86% |
| mean | 0.03ms | 0.03ms | +0.01ms | +19.75% |
| min | 0.01ms | 0.01ms | +0.00ms | +5.64% |
| max | 0.11ms | 0.04ms | +0.07ms | +150.20% |
| total | 0.63ms | 0.53ms | +0.10ms | +19.75% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -1.11% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +34.15% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +1.22% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.71% |
| min | 0.00ms | 0.00ms | -0.00ms | -16.08% |
| max | 0.01ms | 0.01ms | -0.00ms | -4.42% |
| total | 0.08ms | 0.08ms | +0.00ms | +1.71% |

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
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +2.59% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -1.53% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +0.64% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.97% |
| min | 0.00ms | 0.00ms | +0.00ms | +5.69% |
| max | 0.00ms | 0.00ms | +0.00ms | +0.93% |
| total | 0.04ms | 0.04ms | +0.00ms | +1.97% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.08ms |
| p99 | 0.08ms |
| mean | 0.04ms |
| stdev | 0.02ms |
| min | 0.03ms |
| max | 0.09ms |
| total | 0.78ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | +0.00ms | +10.10% |
| p95 | 0.08ms | 0.04ms | +0.04ms | +106.50% |
| p99 | 0.08ms | 0.04ms | +0.05ms | +117.22% |
| mean | 0.04ms | 0.03ms | +0.01ms | +24.84% |
| min | 0.03ms | 0.03ms | +0.00ms | +4.02% |
| max | 0.09ms | 0.04ms | +0.05ms | +119.78% |
| total | 0.78ms | 0.62ms | +0.16ms | +24.84% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +0.17% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +18.79% |
| p99 | 0.03ms | 0.02ms | +0.01ms | +29.73% |
| mean | 0.01ms | 0.01ms | +0.00ms | +6.88% |
| min | 0.01ms | 0.01ms | +0.00ms | +2.69% |
| max | 0.03ms | 0.02ms | +0.01ms | +32.23% |
| total | 0.28ms | 0.26ms | +0.02ms | +6.88% |

