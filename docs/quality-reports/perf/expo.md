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
| createExpoTestEnv | 398408 B | 0 B | 102400 B | yes | PASS |
| routerPushCycle | -304 B | 0 B | 102400 B | yes | PASS |
| notificationDispatch | -14936 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.02ms |
| total | 0.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +6.98% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +2.18% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -2.65% |
| mean | 0.00ms | 0.00ms | -0.00ms | -1.57% |
| min | 0.00ms | 0.00ms | +0.00ms | +5.31% |
| max | 0.02ms | 0.03ms | -0.01ms | -20.59% |
| total | 0.31ms | 0.31ms | -0.00ms | -1.57% |

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
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +7.56% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -13.11% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -20.53% |
| mean | 0.00ms | 0.00ms | +0.00ms | +0.74% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00ms | -18.84% |
| total | 0.13ms | 0.13ms | +0.00ms | +0.74% |

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
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -5.27% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +164.39% |
| mean | 0.00ms | 0.00ms | +0.00ms | +11.06% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +76.30% |
| total | 0.13ms | 0.12ms | +0.01ms | +11.06% |

