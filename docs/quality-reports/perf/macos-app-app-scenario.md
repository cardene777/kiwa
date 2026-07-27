# Perf Suite — macos-app-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | 0.04ms | 100ms | PASS | stable |
| a11y_batch (5 accessibility tree capture) | 0.01ms | 100ms | PASS | stable |
| notification_error_handling (5 empty title/body reject) | 0.00ms | 100ms | PASS | stable |
| retry_recovery (5 flaky async retry to success) | 0.05ms | 100ms | PASS | n/a (baseline seeded) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.01ms | 100ms | PASS | n/a (baseline seeded) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | 0.07ms | 200ms | PASS |
| a11y_batch (5 accessibility tree capture) | 0.02ms | 200ms | PASS |
| notification_error_handling (5 empty title/body reject) | 0.01ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.13ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | 473240 B | 30400 B | 102400 B | PASS |
| a11y_batch (5 accessibility tree capture) | 163832 B | 0 B | 102400 B | PASS |
| notification_error_handling (5 empty title/body reject) | 73920 B | 0 B | 102400 B | PASS |
| retry_recovery (5 flaky async retry to success) | 559000 B | 0 B | 102400 B | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | -7664160 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### user_flow_workflow (10 interaction+screencap cycle across modes)

# Perf Report — user_flow_workflow (10 interaction+screencap cycle across modes).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.05ms |
| total | 0.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.04ms | -0.02ms | -37.91% |
| p95 | 0.04ms | 0.05ms | -0.01ms | -17.92% |
| p99 | 0.05ms | 0.06ms | -0.01ms | -18.20% |
| mean | 0.03ms | 0.04ms | -0.02ms | -39.35% |
| min | 0.01ms | 0.03ms | -0.02ms | -55.11% |
| max | 0.05ms | 0.06ms | -0.01ms | -18.26% |
| total | 0.53ms | 0.88ms | -0.35ms | -39.35% |

### a11y_batch (5 accessibility tree capture)

# Perf Report — a11y_batch (5 accessibility tree capture).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.00ms | +0.00ms | +35.74% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +24.19% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +6.11% |
| mean | 0.01ms | 0.00ms | +0.00ms | +24.94% |
| min | 0.00ms | 0.00ms | -0.00ms | -5.90% |
| max | 0.01ms | 0.01ms | +0.00ms | +2.63% |
| total | 0.10ms | 0.08ms | +0.02ms | +24.94% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -20.85% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -35.45% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -14.13% |
| mean | 0.00ms | 0.00ms | -0.00ms | -18.86% |
| min | 0.00ms | 0.00ms | -0.00ms | -26.67% |
| max | 0.00ms | 0.01ms | -0.00ms | -9.84% |
| total | 0.04ms | 0.05ms | -0.01ms | -18.86% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 0.67ms |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.21ms |

