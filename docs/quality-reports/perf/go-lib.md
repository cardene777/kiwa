# Perf Suite — go-lib

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeGinHandler | 0.00ms | 5ms | PASS | stable |
| invokeEchoHandler | 0.00ms | 5ms | PASS | stable |
| invokeFiberHandler | 0.00ms | 5ms | PASS | stable |
| captureChiRoute | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeGinHandler | 0.01ms | 10ms | PASS |
| invokeEchoHandler | 0.03ms | 10ms | PASS |
| invokeFiberHandler | 0.02ms | 10ms | PASS |
| captureChiRoute | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeGinHandler | -9096 B | -60998 B | 102400 B | yes | PASS |
| invokeEchoHandler | 832 B | 0 B | 102400 B | yes | PASS |
| invokeFiberHandler | -31944 B | 0 B | 102400 B | yes | PASS |
| captureChiRoute | 6936 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeGinHandler

# Perf Report — invokeGinHandler.serial

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
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -57.60% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -53.62% |
| p99 | 0.01ms | 0.01ms | -0.01ms | -57.10% |
| mean | 0.00ms | 0.00ms | -0.00ms | -49.40% |
| min | 0.00ms | 0.00ms | +0.00ms | +20.19% |
| max | 0.01ms | 0.04ms | -0.03ms | -76.07% |
| total | 0.16ms | 0.31ms | -0.15ms | -49.40% |

### invokeEchoHandler

# Perf Report — invokeEchoHandler.serial

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -13.44% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -12.07% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -12.47% |
| mean | 0.00ms | 0.00ms | -0.00ms | -14.21% |
| min | 0.00ms | 0.00ms | -0.00ms | -15.34% |
| max | 0.01ms | 0.01ms | -0.00ms | -1.46% |
| total | 0.13ms | 0.15ms | -0.02ms | -14.21% |

### invokeFiberHandler

# Perf Report — invokeFiberHandler.serial

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
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +39.18% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +13.93% |
| mean | 0.00ms | 0.00ms | +0.00ms | +4.06% |
| min | 0.00ms | 0.00ms | +0.00ms | +0.18% |
| max | 0.01ms | 0.01ms | +0.00ms | +17.98% |
| total | 0.16ms | 0.15ms | +0.01ms | +4.06% |

### captureChiRoute

# Perf Report — captureChiRoute.serial

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
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -10.07% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -56.59% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -60.90% |
| mean | 0.00ms | 0.00ms | -0.00ms | -38.85% |
| min | 0.00ms | 0.00ms | -0.00ms | -15.68% |
| max | 0.01ms | 0.02ms | -0.01ms | -49.19% |
| total | 0.20ms | 0.33ms | -0.13ms | -38.85% |

