# Perf Suite — python

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| dispatchRequest | 0.00ms | 5ms | PASS | stable |
| renderTemplate | 0.00ms | 5ms | PASS | stable |
| captureMiddlewareCall | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dispatchRequest | 0.01ms | 10ms | PASS |
| renderTemplate | 0.01ms | 10ms | PASS |
| captureMiddlewareCall | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| dispatchRequest | 420416 B | 0 B | 102400 B | PASS |
| renderTemplate | 326904 B | 0 B | 102400 B | PASS |
| captureMiddlewareCall | 162024 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### dispatchRequest

# Perf Report — dispatchRequest.serial

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -6.72% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -14.78% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -30.34% |
| mean | 0.00ms | 0.00ms | -0.00ms | -22.82% |
| min | 0.00ms | 0.00ms | -0.00ms | -8.40% |
| max | 0.01ms | 0.03ms | -0.02ms | -69.62% |
| total | 0.15ms | 0.19ms | -0.04ms | -22.82% |

### renderTemplate

# Perf Report — renderTemplate.serial

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -8.20% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -62.83% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -4.24% |
| mean | 0.00ms | 0.00ms | -0.00ms | -6.21% |
| min | 0.00ms | 0.00ms | +0.00ms | +9.83% |
| max | 0.01ms | 0.01ms | +0.01ms | +139.01% |
| total | 0.12ms | 0.13ms | -0.01ms | -6.21% |

### captureMiddlewareCall

# Perf Report — captureMiddlewareCall.serial

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
| max | 0.05ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -38.97% |
| p99 | 0.01ms | 0.00ms | +0.01ms | +426.04% |
| mean | 0.00ms | 0.00ms | +0.00ms | +105.56% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.05ms | 0.01ms | +0.04ms | +463.19% |
| total | 0.16ms | 0.08ms | +0.08ms | +105.56% |

