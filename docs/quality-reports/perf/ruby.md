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
| dispatchRailsRequest | -15504 B | 0 B | 102400 B | yes | PASS |
| dispatchGenericRequest | -48 B | 0 B | 102400 B | yes | PASS |
| renderERB | -19024 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.02ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +4.28% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +12.03% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -11.07% |
| mean | 0.00ms | 0.00ms | +0.00ms | +3.53% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.00ms | +19.25% |
| total | 0.16ms | 0.15ms | +0.01ms | +3.53% |

### dispatchGenericRequest

# Perf Report — dispatchGenericRequest.serial

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
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.22% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +202.13% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +152.07% |
| mean | 0.00ms | 0.00ms | +0.00ms | +87.73% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.03ms | 0.00ms | +0.03ms | +692.70% |
| total | 0.19ms | 0.10ms | +0.09ms | +87.73% |

### renderERB

# Perf Report — renderERB.serial

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +9.83% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +32.63% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +8.72% |
| mean | 0.00ms | 0.00ms | +0.00ms | +7.77% |
| min | 0.00ms | 0.00ms | +0.00ms | +10.93% |
| max | 0.01ms | 0.01ms | +0.00ms | +2.92% |
| total | 0.12ms | 0.11ms | +0.01ms | +7.77% |

