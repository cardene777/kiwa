# Perf Suite — mcp-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| tool_registration_burst (server + 20 register) | 0.01ms | 30ms | PASS | stable |
| schema_validate_loop (50 validateSchema) | 0.02ms | 30ms | PASS | stable |
| server_lifecycle (register + unregister × 10 cycle) | 0.00ms | 30ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| tool_registration_burst (server + 20 register) | 0.01ms | 60ms | PASS |
| schema_validate_loop (50 validateSchema) | 0.04ms | 60ms | PASS |
| server_lifecycle (register + unregister × 10 cycle) | 0.02ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| tool_registration_burst (server + 20 register) | -20192 B | 0 B | 102400 B | PASS |
| schema_validate_loop (50 validateSchema) | 1273416 B | 0 B | 102400 B | PASS |
| server_lifecycle (register + unregister × 10 cycle) | 154568 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### tool_registration_burst (server + 20 register)

# Perf Report — tool_registration_burst (server + 20 register).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +12.50% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +24.53% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -12.90% |
| mean | 0.00ms | 0.00ms | +0.00ms | +0.82% |
| min | 0.00ms | 0.00ms | -0.00ms | -16.44% |
| max | 0.02ms | 0.03ms | -0.01ms | -22.27% |
| total | 0.15ms | 0.15ms | +0.00ms | +0.82% |

### schema_validate_loop (50 validateSchema)

# Perf Report — schema_validate_loop (50 validateSchema).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -5.55% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -1.65% |
| p99 | 0.03ms | 0.03ms | -0.00ms | -0.58% |
| mean | 0.02ms | 0.02ms | -0.00ms | -2.48% |
| min | 0.01ms | 0.01ms | +0.00ms | +0.57% |
| max | 0.03ms | 0.03ms | +0.00ms | +0.16% |
| total | 0.51ms | 0.52ms | -0.01ms | -2.48% |

### server_lifecycle (register + unregister × 10 cycle)

# Perf Report — server_lifecycle (register + unregister × 10 cycle).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -1.24% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -13.74% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +31.66% |
| mean | 0.00ms | 0.00ms | -0.00ms | -9.31% |
| min | 0.00ms | 0.00ms | -0.00ms | -17.52% |
| max | 0.01ms | 0.00ms | +0.00ms | +47.53% |
| total | 0.05ms | 0.06ms | -0.01ms | -9.31% |

