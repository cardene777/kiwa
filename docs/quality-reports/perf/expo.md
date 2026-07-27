# Perf Suite — expo

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| createExpoTestEnv | 0.00ms | 5ms | PASS | stable |
| routerPushCycle | 0.00ms | 5ms | PASS | stable |
| notificationDispatch | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createExpoTestEnv | 0.02ms | 10ms | PASS |
| routerPushCycle | 0.02ms | 10ms | PASS |
| notificationDispatch | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| createExpoTestEnv | -9528 B | 0 B | 102400 B | yes | PASS |
| routerPushCycle | 712 B | 0 B | 102400 B | yes | PASS |
| notificationDispatch | -14968 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +6.98% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +28.07% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +11.62% |
| mean | 0.00ms | 0.00ms | +0.00ms | +2.50% |
| min | 0.00ms | 0.00ms | +0.00ms | +5.31% |
| max | 0.03ms | 0.03ms | -0.00ms | -6.63% |
| total | 0.32ms | 0.31ms | +0.01ms | +2.50% |

### routerPushCycle

# Perf Report — routerPushCycle.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.06ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +18.01% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +51.72% |
| mean | 0.00ms | 0.00ms | +0.00ms | +44.05% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.06ms | 0.01ms | +0.05ms | +814.24% |
| total | 0.19ms | 0.13ms | +0.06ms | +44.05% |

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
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -8.20% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +9.57% |
| p99 | 0.01ms | 0.00ms | +0.01ms | +204.85% |
| mean | 0.00ms | 0.00ms | +0.00ms | +11.28% |
| min | 0.00ms | 0.00ms | -0.00ms | -18.12% |
| max | 0.01ms | 0.01ms | +0.00ms | +86.67% |
| total | 0.13ms | 0.12ms | +0.01ms | +11.28% |

