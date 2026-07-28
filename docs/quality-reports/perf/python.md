# Perf Suite — python

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| dispatchRequest | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +42242%) 以上の悪化が必要) |
| renderTemplate | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +92413%) 以上の悪化が必要) |
| captureMiddlewareCall | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +171821%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dispatchRequest | 0.02ms | 10ms | PASS |
| renderTemplate | 0.01ms | 10ms | PASS |
| captureMiddlewareCall | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dispatchRequest | -17232 B | 0 B | 102400 B | yes | PASS |
| renderTemplate | -18216 B | 0 B | 102400 B | yes | PASS |
| captureMiddlewareCall | -632 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +66.13% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +61.66% |
| mean | 0.00ms | 0.00ms | +0.00ms | +7.34% |
| min | 0.00ms | 0.00ms | -0.00ms | -33.40% |
| max | 0.01ms | 0.01ms | +0.00ms | +4.88% |
| total | 0.14ms | 0.13ms | +0.01ms | +7.34% |

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
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -8.95% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +7.94% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -9.08% |
| mean | 0.00ms | 0.00ms | -0.00ms | -3.20% |
| min | 0.00ms | 0.00ms | -0.00ms | -9.86% |
| max | 0.01ms | 0.01ms | -0.00ms | -1.82% |
| total | 0.10ms | 0.11ms | -0.00ms | -3.20% |

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
| max | 0.02ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +0.34% |
| p99 | 0.01ms | 0.00ms | +0.01ms | +870.46% |
| mean | 0.00ms | 0.00ms | +0.00ms | +44.93% |
| min | 0.00ms | 0.00ms | -0.00ms | -24.70% |
| max | 0.02ms | 0.01ms | +0.01ms | +50.55% |
| total | 0.09ms | 0.06ms | +0.03ms | +44.93% |

