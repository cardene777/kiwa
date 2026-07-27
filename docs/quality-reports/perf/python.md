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
| dispatchRequest | -5800 B | 0 B | 102400 B | yes | PASS |
| renderTemplate | -3608 B | 0 B | 102400 B | yes | PASS |
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
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -22.14% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -1.20% |
| mean | 0.00ms | 0.00ms | -0.00ms | -1.62% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | -0.00ms | -15.97% |
| total | 0.12ms | 0.13ms | -0.00ms | -1.62% |

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
| p95 | 0.00ms | 0.00ms | +0.00ms | +9.52% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +84.67% |
| mean | 0.00ms | 0.00ms | +0.00ms | +7.69% |
| min | 0.00ms | 0.00ms | -0.00ms | -9.86% |
| max | 0.01ms | 0.01ms | +0.00ms | +34.34% |
| total | 0.11ms | 0.10ms | +0.01ms | +7.69% |

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
| p95 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +28.22% |
| mean | 0.00ms | 0.00ms | +0.00ms | +22.30% |
| min | 0.00ms | 0.00ms | +0.00ms | +32.80% |
| max | 0.01ms | 0.01ms | +0.00ms | +40.72% |
| total | 0.06ms | 0.05ms | +0.01ms | +22.30% |

