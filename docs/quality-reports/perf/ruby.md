# Perf Suite — ruby

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| dispatchRailsRequest | 0.00ms | 5ms | PASS | stable |
| dispatchGenericRequest | 0.00ms | 5ms | PASS | improved |
| renderERB | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dispatchRailsRequest | 0.01ms | 10ms | PASS |
| dispatchGenericRequest | 0.01ms | 10ms | PASS |
| renderERB | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| dispatchRailsRequest | 473448 B | 0 B | 102400 B | PASS |
| dispatchGenericRequest | 387664 B | 0 B | 102400 B | PASS |
| renderERB | 312440 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### dispatchRailsRequest

# Perf Report — dispatchRailsRequest.serial

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
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -6.06% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -4.56% |
| mean | 0.00ms | 0.00ms | +0.00ms | +8.86% |
| min | 0.00ms | 0.00ms | +0.00ms | +22.13% |
| max | 0.01ms | 0.01ms | +0.01ms | +66.13% |
| total | 0.15ms | 0.14ms | +0.01ms | +8.86% |

### dispatchGenericRequest

# Perf Report — dispatchGenericRequest.serial

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
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -68.19% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -16.73% |
| mean | 0.00ms | 0.00ms | -0.00ms | -22.86% |
| min | 0.00ms | 0.00ms | -0.00ms | -0.24% |
| max | 0.00ms | 0.01ms | -0.00ms | -9.52% |
| total | 0.11ms | 0.15ms | -0.03ms | -22.86% |

### renderERB

# Perf Report — renderERB.serial

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
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +9.17% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -53.52% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +41.47% |
| mean | 0.00ms | 0.00ms | +0.00ms | +3.70% |
| min | 0.00ms | 0.00ms | +0.00ms | +10.10% |
| max | 0.01ms | 0.01ms | +0.01ms | +79.16% |
| total | 0.14ms | 0.13ms | +0.00ms | +3.70% |

