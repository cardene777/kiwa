# Perf Suite — go-lib

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeGinHandler | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +33103%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| invokeEchoHandler | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +73465%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| invokeFiberHandler | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +69195%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| captureChiRoute | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +14575%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeGinHandler | 0.01ms | 10ms | PASS |
| invokeEchoHandler | 0.02ms | 10ms | PASS |
| invokeFiberHandler | 0.01ms | 10ms | PASS |
| captureChiRoute | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeGinHandler | -4432 B | -60127 B | 102400 B | yes | PASS |
| invokeEchoHandler | 616 B | 0 B | 102400 B | yes | PASS |
| invokeFiberHandler | 616 B | 0 B | 102400 B | yes | PASS |
| captureChiRoute | 21840 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.03ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +7.02% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +4.02% |
| p99 | 0.01ms | 0.01ms | -0.01ms | -59.19% |
| mean | 0.00ms | 0.00ms | -0.00ms | -12.82% |
| min | 0.00ms | 0.00ms | +0.00ms | +7.76% |
| max | 0.03ms | 0.03ms | -0.00ms | -8.87% |
| total | 0.20ms | 0.23ms | -0.03ms | -12.82% |

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
| stdev | 0.04ms |
| min | 0.00ms |
| max | 0.57ms |
| total | 0.76ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +8.40% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +203.09% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -22.09% |
| mean | 0.00ms | 0.01ms | -0.01ms | -66.19% |
| min | 0.00ms | 0.00ms | +0.00ms | +0.22% |
| max | 0.57ms | 1.88ms | -1.31ms | -69.79% |
| total | 0.76ms | 2.23ms | -1.48ms | -66.19% |

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
| max | 0.01ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +15.31% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +3.88% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +58.77% |
| mean | 0.00ms | 0.00ms | +0.00ms | +20.92% |
| min | 0.00ms | 0.00ms | +0.00ms | +27.02% |
| max | 0.01ms | 0.01ms | +0.01ms | +57.34% |
| total | 0.17ms | 0.14ms | +0.03ms | +20.92% |

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
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -57.44% |
| p99 | 0.01ms | 0.15ms | -0.15ms | -93.65% |
| mean | 0.00ms | 0.01ms | -0.01ms | -89.33% |
| min | 0.00ms | 0.00ms | +0.00ms | +10.62% |
| max | 0.01ms | 1.56ms | -1.54ms | -99.16% |
| total | 0.23ms | 2.17ms | -1.94ms | -89.33% |

