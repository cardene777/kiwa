# Perf Suite — date-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +205%) 以上の悪化が必要) |
| format_parse_batch (5 format + parse round-trip) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +4277%) 以上の悪化が必要) |
| parse_error_handling (5 invalid string throw + catch) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +2879%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | 0.04ms | 200ms | PASS |
| format_parse_batch (5 format + parse round-trip) | 0.03ms | 200ms | PASS |
| parse_error_handling (5 invalid string throw + catch) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | -8168 B | -10054 B | 102400 B | yes | PASS |
| format_parse_batch (5 format + parse round-trip) | -1632 B | 0 B | 102400 B | yes | PASS |
| parse_error_handling (5 invalid string throw + catch) | -728 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_provider_workflow (10 arithmetic across 4 providers)

# Perf Report — multi_provider_workflow (10 arithmetic across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -7.92% |
| p95 | 0.01ms | 0.24ms | -0.23ms | -94.68% |
| p99 | 0.01ms | 0.27ms | -0.25ms | -94.92% |
| mean | 0.01ms | 0.03ms | -0.03ms | -80.28% |
| min | 0.00ms | 0.01ms | -0.00ms | -41.74% |
| max | 0.01ms | 0.27ms | -0.26ms | -94.97% |
| total | 0.12ms | 0.63ms | -0.51ms | -80.28% |

### format_parse_batch (5 format + parse round-trip)

# Perf Report — format_parse_batch (5 format + parse round-trip).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.01ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -6.12% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -15.77% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -42.04% |
| mean | 0.01ms | 0.01ms | -0.00ms | -12.45% |
| min | 0.01ms | 0.01ms | -0.00ms | -6.50% |
| max | 0.01ms | 0.03ms | -0.01ms | -45.04% |
| total | 0.17ms | 0.19ms | -0.02ms | -12.45% |

### parse_error_handling (5 invalid string throw + catch)

# Perf Report — parse_error_handling (5 invalid string throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.02ms | -0.00ms | -3.31% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +24.07% |
| p99 | 0.02ms | 0.03ms | -0.00ms | -15.15% |
| mean | 0.02ms | 0.02ms | -0.00ms | -2.10% |
| min | 0.01ms | 0.01ms | -0.00ms | -4.47% |
| max | 0.02ms | 0.03ms | -0.01ms | -21.33% |
| total | 0.31ms | 0.32ms | -0.01ms | -2.10% |

