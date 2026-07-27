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

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| invokeGinHandler | 488704 B | 0 B | 102400 B | PASS |
| invokeEchoHandler | 459992 B | 0 B | 102400 B | PASS |
| invokeFiberHandler | 127968 B | 0 B | 102400 B | PASS |
| captureChiRoute | 628792 B | 0 B | 102400 B | PASS |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +29.98% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +9.40% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +26.68% |
| mean | 0.00ms | 0.00ms | +0.00ms | +11.29% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +32.33% |
| total | 0.15ms | 0.14ms | +0.02ms | +11.29% |

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
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -65.21% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +19.76% |
| mean | 0.00ms | 0.00ms | -0.00ms | -12.69% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +30.71% |
| total | 0.12ms | 0.14ms | -0.02ms | -12.69% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +8.20% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -46.43% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +8.12% |
| mean | 0.00ms | 0.00ms | -0.00ms | -11.03% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +37.30% |
| total | 0.14ms | 0.15ms | -0.02ms | -11.03% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +5.78% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +19.64% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +57.08% |
| mean | 0.00ms | 0.00ms | +0.00ms | +9.35% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +23.26% |
| total | 0.20ms | 0.19ms | +0.02ms | +9.35% |

