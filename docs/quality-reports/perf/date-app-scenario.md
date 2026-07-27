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
| multi_provider_workflow (10 arithmetic across 4 providers) | 0.04ms | 200ms | PASS |
| format_parse_batch (5 format + parse round-trip) | 0.05ms | 200ms | PASS |
| parse_error_handling (5 invalid string throw + catch) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | 538944 B | 0 B | 102400 B | PASS |
| format_parse_batch (5 format + parse round-trip) | 272056 B | 0 B | 102400 B | PASS |
| parse_error_handling (5 invalid string throw + catch) | 122352 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### multi_provider_workflow (10 arithmetic across 4 providers)

# Perf Report — multi_provider_workflow (10 arithmetic across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.01ms | -0.00ms | -30.70% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -34.18% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -17.06% |
| mean | 0.00ms | 0.01ms | -0.00ms | -17.65% |
| min | 0.00ms | 0.00ms | +0.00ms | +2.77% |
| max | 0.01ms | 0.01ms | -0.00ms | -13.34% |
| total | 0.08ms | 0.10ms | -0.02ms | -17.65% |

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
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +20.92% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -5.67% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +5.27% |
| mean | 0.01ms | 0.01ms | +0.00ms | +8.60% |
| min | 0.01ms | 0.01ms | -0.00ms | -1.45% |
| max | 0.02ms | 0.01ms | +0.00ms | +7.88% |
| total | 0.17ms | 0.15ms | +0.01ms | +8.60% |

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
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +0.58% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -10.57% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -3.15% |
| mean | 0.02ms | 0.02ms | -0.00ms | -0.53% |
| min | 0.01ms | 0.01ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.02ms | -0.00ms | -1.51% |
| total | 0.30ms | 0.30ms | -0.00ms | -0.53% |

