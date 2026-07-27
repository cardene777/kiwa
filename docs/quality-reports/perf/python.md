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

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dispatchRequest | -1224 B | 0 B | 102400 B | yes | PASS |
| renderTemplate | -3624 B | 0 B | 102400 B | yes | PASS |
| captureMiddlewareCall | 912 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.00ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +8.40% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -16.85% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +0.04% |
| mean | 0.00ms | 0.00ms | +0.00ms | +3.56% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +0.02% |
| total | 0.13ms | 0.13ms | +0.00ms | +3.56% |

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
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +7.88% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +80.46% |
| mean | 0.00ms | 0.00ms | +0.00ms | +8.02% |
| min | 0.00ms | 0.00ms | -0.00ms | -9.86% |
| max | 0.01ms | 0.01ms | +0.00ms | +67.17% |
| total | 0.11ms | 0.10ms | +0.01ms | +8.02% |

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
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +64.18% |
| mean | 0.00ms | 0.00ms | +0.00ms | +16.24% |
| min | 0.00ms | 0.00ms | +0.00ms | +32.80% |
| max | 0.01ms | 0.01ms | +0.00ms | +49.29% |
| total | 0.06ms | 0.05ms | +0.01ms | +16.24% |

