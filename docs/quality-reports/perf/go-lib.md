# Perf Suite — go-lib

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeGinHandler | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +33103%) 以上の悪化が必要) |
| invokeEchoHandler | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +73465%) 以上の悪化が必要) |
| invokeFiberHandler | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +69195%) 以上の悪化が必要) |
| captureChiRoute | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +14575%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeGinHandler | 0.01ms | 10ms | PASS |
| invokeEchoHandler | 0.01ms | 10ms | PASS |
| invokeFiberHandler | 0.02ms | 10ms | PASS |
| captureChiRoute | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeGinHandler | 344376 B | 0 B | 102400 B | yes | PASS |
| invokeEchoHandler | 185496 B | 0 B | 102400 B | yes | PASS |
| invokeFiberHandler | -744 B | 0 B | 102400 B | yes | PASS |
| captureChiRoute | -5256 B | 0 B | 102400 B | yes | PASS |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -0.17% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +2.50% |
| p99 | 0.01ms | 0.01ms | -0.01ms | -61.24% |
| mean | 0.00ms | 0.00ms | -0.00ms | -27.37% |
| min | 0.00ms | 0.00ms | -0.00ms | -7.58% |
| max | 0.01ms | 0.03ms | -0.02ms | -54.63% |
| total | 0.16ms | 0.23ms | -0.06ms | -27.37% |

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
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -6.33% |
| p99 | 0.00ms | 0.01ms | -0.01ms | -64.85% |
| mean | 0.00ms | 0.01ms | -0.01ms | -93.57% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.02ms | 1.88ms | -1.86ms | -98.83% |
| total | 0.14ms | 2.23ms | -2.09ms | -93.57% |

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
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -0.18% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +26.77% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +19.21% |
| mean | 0.00ms | 0.00ms | -0.00ms | -0.32% |
| min | 0.00ms | 0.00ms | -0.00ms | -0.22% |
| max | 0.01ms | 0.01ms | +0.00ms | +7.58% |
| total | 0.14ms | 0.14ms | -0.00ms | -0.32% |

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
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -13.74% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -54.81% |
| p99 | 0.01ms | 0.15ms | -0.15ms | -95.39% |
| mean | 0.00ms | 0.01ms | -0.01ms | -90.48% |
| min | 0.00ms | 0.00ms | -0.00ms | -15.68% |
| max | 0.01ms | 1.56ms | -1.54ms | -99.22% |
| total | 0.21ms | 2.17ms | -1.97ms | -90.48% |

