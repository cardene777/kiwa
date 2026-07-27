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
| dispatchRequest | 0.03ms | 10ms | PASS |
| renderTemplate | 0.01ms | 10ms | PASS |
| captureMiddlewareCall | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dispatchRequest | 2344 B | 0 B | 102400 B | yes | PASS |
| renderTemplate | -18032 B | 0 B | 102400 B | yes | PASS |
| captureMiddlewareCall | 464 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.02ms |
| total | 0.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +158.40% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +101.99% |
| p99 | 0.01ms | 0.00ms | +0.01ms | +133.42% |
| mean | 0.00ms | 0.00ms | +0.00ms | +160.64% |
| min | 0.00ms | 0.00ms | +0.00ms | +155.47% |
| max | 0.02ms | 0.00ms | +0.02ms | +385.76% |
| total | 0.33ms | 0.13ms | +0.20ms | +160.64% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +10.07% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +15.76% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +116.93% |
| mean | 0.00ms | 0.00ms | +0.00ms | +20.62% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +85.08% |
| total | 0.12ms | 0.10ms | +0.02ms | +20.62% |

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
| max | 0.02ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +28.42% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +139.28% |
| mean | 0.00ms | 0.00ms | +0.00ms | +49.62% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.02ms | +282.17% |
| total | 0.08ms | 0.05ms | +0.03ms | +49.62% |

