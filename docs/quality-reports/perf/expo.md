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
| routerPushCycle | 0.01ms | 10ms | PASS |
| notificationDispatch | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| createExpoTestEnv | -4360 B | 0 B | 102400 B | yes | PASS |
| routerPushCycle | -14920 B | 0 B | 102400 B | yes | PASS |
| notificationDispatch | -3336 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +2.40% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -1.53% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +2.13% |
| mean | 0.00ms | 0.00ms | -0.00ms | -0.68% |
| min | 0.00ms | 0.00ms | +0.00ms | +5.31% |
| max | 0.03ms | 0.03ms | -0.00ms | -6.35% |
| total | 0.31ms | 0.31ms | -0.00ms | -0.68% |

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
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -0.18% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -11.91% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +41.61% |
| mean | 0.00ms | 0.00ms | +0.00ms | +11.18% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.02ms | +250.63% |
| total | 0.14ms | 0.13ms | +0.01ms | +11.18% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -8.20% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +45.60% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +184.58% |
| mean | 0.00ms | 0.00ms | +0.00ms | +17.37% |
| min | 0.00ms | 0.00ms | -0.00ms | -9.17% |
| max | 0.01ms | 0.01ms | +0.01ms | +125.92% |
| total | 0.14ms | 0.12ms | +0.02ms | +17.37% |

