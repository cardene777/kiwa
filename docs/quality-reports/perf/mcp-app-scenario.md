# Perf Suite — mcp-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| tool_registration_burst (server + 20 register) | 0.01ms | 30ms | PASS | stable |
| schema_validate_loop (50 validateSchema) | 0.03ms | 30ms | PASS | stable |
| server_lifecycle (register + unregister × 10 cycle) | 0.00ms | 30ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| tool_registration_burst (server + 20 register) | 0.01ms | 60ms | PASS |
| schema_validate_loop (50 validateSchema) | 0.03ms | 60ms | PASS |
| server_lifecycle (register + unregister × 10 cycle) | 0.02ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| tool_registration_burst (server + 20 register) | -17240 B | 0 B | 102400 B | yes | PASS |
| schema_validate_loop (50 validateSchema) | -15544 B | 0 B | 102400 B | yes | PASS |
| server_lifecycle (register + unregister × 10 cycle) | 10952 B | 0 B | 102400 B | yes | PASS |

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
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.03ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +1.07% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +19.35% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +9.51% |
| mean | 0.01ms | 0.01ms | +0.00ms | +3.89% |
| min | 0.00ms | 0.00ms | +0.00ms | +5.95% |
| max | 0.03ms | 0.02ms | +0.00ms | +6.32% |
| total | 0.16ms | 0.15ms | +0.01ms | +3.89% |

### schema_validate_loop (50 validateSchema)

# Perf Report — schema_validate_loop (50 validateSchema).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.10ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.13ms |
| total | 0.65ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -11.72% |
| p95 | 0.03ms | 0.03ms | -0.00ms | -4.45% |
| p99 | 0.10ms | 0.03ms | +0.07ms | +211.15% |
| mean | 0.02ms | 0.02ms | +0.00ms | +9.32% |
| min | 0.01ms | 0.02ms | -0.00ms | -10.55% |
| max | 0.13ms | 0.03ms | +0.10ms | +299.50% |
| total | 0.65ms | 0.59ms | +0.06ms | +9.32% |

### server_lifecycle (register + unregister × 10 cycle)

# Perf Report — server_lifecycle (register + unregister × 10 cycle).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -4.06% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +10.93% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +85.41% |
| mean | 0.00ms | 0.00ms | -0.00ms | -0.53% |
| min | 0.00ms | 0.00ms | -0.00ms | -12.77% |
| max | 0.01ms | 0.00ms | +0.00ms | +104.25% |
| total | 0.06ms | 0.06ms | -0.00ms | -0.53% |

