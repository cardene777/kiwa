# Perf Suite — expo

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| createExpoTestEnv | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +15782%) 以上の悪化が必要) |
| routerPushCycle | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +60020%) 以上の悪化が必要) |
| notificationDispatch | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +49895%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createExpoTestEnv | 0.04ms | 10ms | PASS |
| routerPushCycle | 0.01ms | 10ms | PASS |
| notificationDispatch | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| createExpoTestEnv | -10456 B | 0 B | 102400 B | yes | PASS |
| routerPushCycle | -16352 B | 0 B | 102400 B | yes | PASS |
| notificationDispatch | 592 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### createExpoTestEnv

# Perf Report — createExpoTestEnv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.03ms |
| total | 0.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +1.99% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -10.31% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -47.83% |
| mean | 0.00ms | 0.00ms | -0.00ms | -23.72% |
| min | 0.00ms | 0.00ms | -0.00ms | -13.54% |
| max | 0.03ms | 0.08ms | -0.05ms | -62.69% |
| total | 0.33ms | 0.43ms | -0.10ms | -23.72% |

### routerPushCycle

# Perf Report — routerPushCycle.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.10ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -7.20% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +7.54% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +140.37% |
| mean | 0.00ms | 0.00ms | +0.00ms | +69.64% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.10ms | 0.01ms | +0.10ms | +1719.27% |
| total | 0.23ms | 0.13ms | +0.09ms | +69.64% |

### notificationDispatch

# Perf Report — notificationDispatch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -7.75% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +29.34% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +121.85% |
| mean | 0.00ms | 0.00ms | +0.00ms | +0.25% |
| min | 0.00ms | 0.00ms | -0.00ms | -16.60% |
| max | 0.01ms | 0.01ms | -0.00ms | -25.81% |
| total | 0.14ms | 0.14ms | +0.00ms | +0.25% |

