# Perf Suite — ruby

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| dispatchRailsRequest | 0.00ms | 5ms | PASS | stable |
| dispatchGenericRequest | 0.00ms | 5ms | PASS | stable |
| renderERB | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dispatchRailsRequest | 0.01ms | 10ms | PASS |
| dispatchGenericRequest | 0.01ms | 10ms | PASS |
| renderERB | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dispatchRailsRequest | -6280 B | 0 B | 102400 B | yes | PASS |
| dispatchGenericRequest | -416 B | 0 B | 102400 B | yes | PASS |
| renderERB | -19424 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dispatchRailsRequest

# Perf Report — dispatchRailsRequest.serial

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +4.28% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -6.33% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -22.37% |
| mean | 0.00ms | 0.00ms | -0.00ms | -4.13% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00ms | -9.32% |
| total | 0.15ms | 0.15ms | -0.01ms | -4.13% |

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
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +16.79% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +27.00% |
| mean | 0.00ms | 0.00ms | +0.00ms | +0.72% |
| min | 0.00ms | 0.00ms | -0.00ms | -9.86% |
| max | 0.00ms | 0.00ms | +0.00ms | +10.29% |
| total | 0.10ms | 0.10ms | +0.00ms | +0.72% |

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
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +12.04% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +59.79% |
| mean | 0.00ms | 0.00ms | +0.00ms | +7.06% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +1.25% |
| total | 0.12ms | 0.11ms | +0.01ms | +7.06% |

