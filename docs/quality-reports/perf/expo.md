# Perf Suite — expo

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| createExpoTestEnv | 0.00ms | 5ms | PASS | stable |
| routerPushCycle | 0.00ms | 5ms | PASS | improved |
| notificationDispatch | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createExpoTestEnv | 0.02ms | 10ms | PASS |
| routerPushCycle | 0.01ms | 10ms | PASS |
| notificationDispatch | 0.04ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| createExpoTestEnv | 1077472 B | 0 B | 102400 B | PASS |
| routerPushCycle | 1048952 B | 0 B | 102400 B | PASS |
| notificationDispatch | 632096 B | 0 B | 102400 B | PASS |

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
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -33.38% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +4.56% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +6.06% |
| mean | 0.00ms | 0.00ms | -0.00ms | -5.69% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.03ms | 0.02ms | +0.01ms | +32.09% |
| total | 0.30ms | 0.32ms | -0.02ms | -5.69% |

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
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -7.20% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -38.73% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -25.93% |
| mean | 0.00ms | 0.00ms | -0.00ms | -31.42% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00ms | -29.49% |
| total | 0.12ms | 0.18ms | -0.06ms | -31.42% |

### notificationDispatch

# Perf Report — notificationDispatch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.03ms |
| min | 0.00ms |
| max | 0.36ms |
| total | 0.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -7.58% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +62.27% |
| p99 | 0.02ms | 0.00ms | +0.02ms | +624.92% |
| mean | 0.00ms | 0.00ms | +0.00ms | +376.78% |
| min | 0.00ms | 0.00ms | -0.00ms | -18.12% |
| max | 0.36ms | 0.01ms | +0.36ms | +5627.68% |
| total | 0.60ms | 0.13ms | +0.47ms | +376.78% |

