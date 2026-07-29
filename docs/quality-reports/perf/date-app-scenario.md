# Perf Suite — date-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +205%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| format_parse_batch (5 format + parse round-trip) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +4277%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| parse_error_handling (5 invalid string throw + catch) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +2879%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | 0.04ms | 200ms | PASS |
| format_parse_batch (5 format + parse round-trip) | 0.05ms | 200ms | PASS |
| parse_error_handling (5 invalid string throw + catch) | 0.07ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | 6680 B | -9454 B | 102400 B | yes | PASS |
| format_parse_batch (5 format + parse round-trip) | -2496 B | 0 B | 102400 B | yes | PASS |
| parse_error_handling (5 invalid string throw + catch) | -14984 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_provider_workflow (10 arithmetic across 4 providers)

# Perf Report — multi_provider_workflow (10 arithmetic across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +0.77% |
| p95 | 0.01ms | 0.24ms | -0.23ms | -95.50% |
| p99 | 0.02ms | 0.27ms | -0.25ms | -94.06% |
| mean | 0.01ms | 0.03ms | -0.03ms | -79.37% |
| min | 0.01ms | 0.01ms | +0.00ms | +1.57% |
| max | 0.02ms | 0.27ms | -0.25ms | -93.74% |
| total | 0.13ms | 0.63ms | -0.50ms | -79.37% |

### format_parse_batch (5 format + parse round-trip)

# Perf Report — format_parse_batch (5 format + parse round-trip).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +16.18% |
| p95 | 0.02ms | 0.01ms | +0.00ms | +42.22% |
| p99 | 0.02ms | 0.02ms | -0.01ms | -27.06% |
| mean | 0.01ms | 0.01ms | +0.00ms | +10.50% |
| min | 0.01ms | 0.01ms | +0.00ms | +4.01% |
| max | 0.02ms | 0.03ms | -0.01ms | -34.96% |
| total | 0.21ms | 0.19ms | +0.02ms | +10.50% |

### parse_error_handling (5 invalid string throw + catch)

# Perf Report — parse_error_handling (5 invalid string throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.02ms |
| total | 0.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +3.72% |
| p95 | 0.02ms | 0.02ms | +0.01ms | +34.63% |
| p99 | 0.02ms | 0.03ms | -0.00ms | -5.35% |
| mean | 0.02ms | 0.02ms | +0.00ms | +4.66% |
| min | 0.02ms | 0.01ms | +0.00ms | +3.07% |
| max | 0.02ms | 0.03ms | -0.00ms | -11.65% |
| total | 0.33ms | 0.32ms | +0.01ms | +4.66% |

