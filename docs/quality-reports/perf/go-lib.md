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
| invokeEchoHandler | 0.01ms | 10ms | PASS |
| invokeFiberHandler | 0.01ms | 10ms | PASS |
| captureChiRoute | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeGinHandler | -3864 B | 0 B | 102400 B | yes | PASS |
| invokeEchoHandler | -1088 B | 0 B | 102400 B | yes | PASS |
| invokeFiberHandler | 256352 B | 0 B | 102400 B | yes | PASS |
| captureChiRoute | -3976 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.02ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -60.65% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -41.86% |
| p99 | 0.01ms | 0.01ms | -0.01ms | -58.35% |
| mean | 0.00ms | 0.00ms | -0.00ms | -50.95% |
| min | 0.00ms | 0.00ms | -0.00ms | -9.86% |
| max | 0.02ms | 0.04ms | -0.03ms | -63.95% |
| total | 0.15ms | 0.31ms | -0.16ms | -50.95% |

### invokeEchoHandler

# Perf Report — invokeEchoHandler.serial

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
| max | 0.08ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -26.72% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +1.75% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +89.12% |
| mean | 0.00ms | 0.00ms | +0.00ms | +37.92% |
| min | 0.00ms | 0.00ms | -0.00ms | -23.11% |
| max | 0.08ms | 0.01ms | +0.08ms | +890.69% |
| total | 0.20ms | 0.15ms | +0.06ms | +37.92% |

### invokeFiberHandler

# Perf Report — invokeFiberHandler.serial

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
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -10.87% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +24.31% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +117.65% |
| mean | 0.00ms | 0.00ms | +0.00ms | +0.99% |
| min | 0.00ms | 0.00ms | -0.00ms | -15.34% |
| max | 0.02ms | 0.01ms | +0.01ms | +68.42% |
| total | 0.15ms | 0.15ms | +0.00ms | +0.99% |

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
| p95 | 0.00ms | 0.00ms | -0.00ms | -58.21% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -58.11% |
| mean | 0.00ms | 0.00ms | -0.00ms | -39.22% |
| min | 0.00ms | 0.00ms | -0.00ms | -15.80% |
| max | 0.01ms | 0.02ms | -0.01ms | -50.63% |
| total | 0.20ms | 0.33ms | -0.13ms | -39.22% |

