# Perf Suite — python

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| dispatchRequest | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +42242%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| renderTemplate | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +92413%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| captureMiddlewareCall | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +171821%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dispatchRequest | 0.01ms | 10ms | PASS |
| renderTemplate | 0.04ms | 10ms | PASS |
| captureMiddlewareCall | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dispatchRequest | -14568 B | 0 B | 102400 B | yes | PASS |
| renderTemplate | 5952 B | 0 B | 102400 B | yes | PASS |
| captureMiddlewareCall | 3576 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dispatchRequest

# Perf Report — dispatchRequest.serial

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
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +7.76% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +24.14% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +59.94% |
| mean | 0.00ms | 0.00ms | +0.00ms | +11.41% |
| min | 0.00ms | 0.00ms | +0.00ms | +8.20% |
| max | 0.01ms | 0.01ms | +0.00ms | +70.73% |
| total | 0.15ms | 0.13ms | +0.01ms | +11.41% |

### renderTemplate

# Perf Report — renderTemplate.serial

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +145.63% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +146.76% |
| p99 | 0.01ms | 0.00ms | +0.01ms | +223.43% |
| mean | 0.00ms | 0.00ms | +0.00ms | +145.99% |
| min | 0.00ms | 0.00ms | +0.00ms | +150.24% |
| max | 0.01ms | 0.01ms | +0.01ms | +106.66% |
| total | 0.26ms | 0.11ms | +0.16ms | +145.99% |

### captureMiddlewareCall

# Perf Report — captureMiddlewareCall.serial

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
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.48% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +1.05% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +26.11% |
| mean | 0.00ms | 0.00ms | +0.00ms | +4.00% |
| min | 0.00ms | 0.00ms | +0.00ms | +0.60% |
| max | 0.01ms | 0.01ms | -0.00ms | -30.55% |
| total | 0.06ms | 0.06ms | +0.00ms | +4.00% |

