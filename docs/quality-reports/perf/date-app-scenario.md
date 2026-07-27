# Perf Suite — date-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | 0.01ms | 100ms | PASS | stable |
| format_parse_batch (5 format + parse round-trip) | 0.01ms | 100ms | PASS | stable |
| parse_error_handling (5 invalid string throw + catch) | 0.02ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | 0.03ms | 200ms | PASS |
| format_parse_batch (5 format + parse round-trip) | 0.03ms | 200ms | PASS |
| parse_error_handling (5 invalid string throw + catch) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | -5184 B | 0 B | 102400 B | yes | PASS |
| format_parse_batch (5 format + parse round-trip) | -1840 B | 0 B | 102400 B | yes | PASS |
| parse_error_handling (5 invalid string throw + catch) | 912 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -6.90% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -14.93% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -18.40% |
| mean | 0.01ms | 0.01ms | -0.00ms | -8.43% |
| min | 0.00ms | 0.00ms | -0.00ms | -6.57% |
| max | 0.01ms | 0.01ms | -0.00ms | -19.14% |
| total | 0.11ms | 0.12ms | -0.01ms | -8.43% |

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
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -12.38% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +2.70% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -42.02% |
| mean | 0.01ms | 0.01ms | -0.00ms | -11.28% |
| min | 0.01ms | 0.01ms | -0.00ms | -28.36% |
| max | 0.01ms | 0.02ms | -0.01ms | -47.66% |
| total | 0.16ms | 0.18ms | -0.02ms | -11.28% |

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
| p50 | 0.01ms | 0.02ms | -0.00ms | -6.80% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -16.43% |
| p99 | 0.02ms | 0.03ms | -0.01ms | -22.40% |
| mean | 0.02ms | 0.02ms | -0.00ms | -8.89% |
| min | 0.01ms | 0.02ms | -0.00ms | -5.66% |
| max | 0.02ms | 0.03ms | -0.01ms | -23.63% |
| total | 0.31ms | 0.34ms | -0.03ms | -8.89% |

