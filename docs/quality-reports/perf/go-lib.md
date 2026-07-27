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
| invokeGinHandler | 0.02ms | 10ms | PASS |
| invokeEchoHandler | 0.01ms | 10ms | PASS |
| invokeFiberHandler | 0.01ms | 10ms | PASS |
| captureChiRoute | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeGinHandler | -8840 B | 0 B | 102400 B | yes | PASS |
| invokeEchoHandler | 160 B | 0 B | 102400 B | yes | PASS |
| invokeFiberHandler | -5040 B | 0 B | 102400 B | yes | PASS |
| captureChiRoute | 1032 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -60.58% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -34.84% |
| p99 | 0.01ms | 0.01ms | -0.01ms | -58.67% |
| mean | 0.00ms | 0.00ms | -0.00ms | -51.15% |
| min | 0.00ms | 0.00ms | -0.00ms | -9.86% |
| max | 0.01ms | 0.04ms | -0.03ms | -70.31% |
| total | 0.15ms | 0.31ms | -0.16ms | -51.15% |

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
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.10ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -26.56% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +31.21% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -5.52% |
| mean | 0.00ms | 0.00ms | +0.00ms | +47.31% |
| min | 0.00ms | 0.00ms | -0.00ms | -23.11% |
| max | 0.10ms | 0.01ms | +0.09ms | +1093.13% |
| total | 0.22ms | 0.15ms | +0.07ms | +47.31% |

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
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -7.36% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +2.61% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +0.53% |
| mean | 0.00ms | 0.00ms | -0.00ms | -11.79% |
| min | 0.00ms | 0.00ms | -0.00ms | -7.58% |
| max | 0.01ms | 0.01ms | -0.00ms | -9.64% |
| total | 0.13ms | 0.15ms | -0.02ms | -11.79% |

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
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +4.92% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -23.39% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -53.78% |
| mean | 0.00ms | 0.00ms | -0.00ms | -20.39% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.02ms | -0.01ms | -47.93% |
| total | 0.26ms | 0.33ms | -0.07ms | -20.39% |

