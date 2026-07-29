# Perf Suite — expo

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| createExpoTestEnv | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +15782%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| routerPushCycle | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +60020%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| notificationDispatch | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +49895%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createExpoTestEnv | 0.07ms | 10ms | PASS |
| routerPushCycle | 0.04ms | 10ms | PASS |
| notificationDispatch | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| createExpoTestEnv | -8408 B | 0 B | 102400 B | yes | PASS |
| routerPushCycle | -744 B | 0 B | 102400 B | yes | PASS |
| notificationDispatch | 2832 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### createExpoTestEnv

# Perf Report — createExpoTestEnv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.04ms |
| min | 0.00ms |
| max | 0.54ms |
| total | 0.94ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -1.30% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +2.23% |
| mean | 0.00ms | 0.00ms | +0.00ms | +118.36% |
| min | 0.00ms | 0.00ms | +0.00ms | +0.11% |
| max | 0.54ms | 0.08ms | +0.46ms | +594.18% |
| total | 0.94ms | 0.43ms | +0.51ms | +118.36% |

### routerPushCycle

# Perf Report — routerPushCycle.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.02ms |
| stdev | 0.23ms |
| min | 0.00ms |
| max | 3.29ms |
| total | 3.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +51.30% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +172.61% |
| mean | 0.02ms | 0.00ms | +0.02ms | +2476.06% |
| min | 0.00ms | 0.00ms | +0.00ms | +8.20% |
| max | 3.29ms | 0.01ms | +3.29ms | +58425.19% |
| total | 3.44ms | 0.13ms | +3.31ms | +2476.06% |

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
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -15.95% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +104.64% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.75% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00ms | -17.20% |
| total | 0.14ms | 0.14ms | +0.00ms | +1.75% |

