# Perf Suite — macos-app-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | 0.86ms | 100ms | PASS | regressed — gate 無効 (regressionGate=false) |
| a11y_batch (5 accessibility tree capture) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +6393%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| notification_error_handling (5 empty title/body reject) | 0.00ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +5263%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.22ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1146%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +2476%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | 0.08ms | 200ms | PASS |
| a11y_batch (5 accessibility tree capture) | 0.04ms | 200ms | PASS |
| notification_error_handling (5 empty title/body reject) | 0.01ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.16ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | -7792 B | -96526 B | 102400 B | yes | PASS |
| a11y_batch (5 accessibility tree capture) | 5144 B | 0 B | 102400 B | yes | PASS |
| notification_error_handling (5 empty title/body reject) | 7904 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 9936 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 12760 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### user_flow_workflow (10 interaction+screencap cycle across modes)

# Perf Report — user_flow_workflow (10 interaction+screencap cycle across modes).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.86ms |
| p99 | 3.91ms |
| mean | 0.30ms |
| stdev | 1.04ms |
| min | 0.01ms |
| max | 4.68ms |
| total | 6.02ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.02ms | +0.01ms | +60.47% |
| p95 | 0.86ms | 0.04ms | +0.82ms | +1865.06% |
| p99 | 3.91ms | 0.05ms | +3.86ms | +7042.97% |
| mean | 0.30ms | 0.02ms | +0.28ms | +1112.85% |
| min | 0.01ms | 0.01ms | +0.00ms | +8.36% |
| max | 4.68ms | 0.06ms | +4.62ms | +8029.35% |
| total | 6.02ms | 0.50ms | +5.53ms | +1112.85% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +22.52% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -13.34% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -12.08% |
| mean | 0.00ms | 0.00ms | +0.00ms | +7.32% |
| min | 0.00ms | 0.00ms | +0.00ms | +14.24% |
| max | 0.01ms | 0.01ms | -0.00ms | -11.82% |
| total | 0.09ms | 0.09ms | +0.01ms | +7.32% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -57.89% |
| p95 | 0.00ms | 0.01ms | -0.01ms | -74.66% |
| p99 | 0.00ms | 0.02ms | -0.02ms | -78.70% |
| mean | 0.00ms | 0.00ms | -0.00ms | -64.31% |
| min | 0.00ms | 0.00ms | -0.00ms | -57.29% |
| max | 0.00ms | 0.02ms | -0.02ms | -79.13% |
| total | 0.03ms | 0.10ms | -0.06ms | -64.31% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.22ms |
| p99 | 1.92ms |
| mean | 0.15ms |
| stdev | 0.52ms |
| min | 0.03ms |
| max | 2.35ms |
| total | 3.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | +0.00ms | +6.65% |
| p95 | 0.22ms | 0.04ms | +0.17ms | +393.50% |
| p99 | 1.92ms | 0.05ms | +1.87ms | +3685.62% |
| mean | 0.15ms | 0.03ms | +0.12ms | +349.75% |
| min | 0.03ms | 0.03ms | +0.00ms | +2.01% |
| max | 2.35ms | 0.05ms | +2.30ms | +4369.12% |
| total | 3.07ms | 0.68ms | +2.39ms | +349.75% |

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
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -5.00% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -12.45% |
| p99 | 0.02ms | 0.02ms | -0.01ms | -22.74% |
| mean | 0.01ms | 0.01ms | -0.00ms | -8.79% |
| min | 0.01ms | 0.01ms | -0.00ms | -2.26% |
| max | 0.02ms | 0.02ms | -0.01ms | -24.91% |
| total | 0.25ms | 0.27ms | -0.02ms | -8.79% |

