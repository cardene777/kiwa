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
| tool_registration_burst (server + 20 register) | 0.02ms | 60ms | PASS |
| schema_validate_loop (50 validateSchema) | 0.04ms | 60ms | PASS |
| server_lifecycle (register + unregister × 10 cycle) | 0.02ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| tool_registration_burst (server + 20 register) | -6840 B | 0 B | 102400 B | yes | PASS |
| schema_validate_loop (50 validateSchema) | 1240 B | 0 B | 102400 B | yes | PASS |
| server_lifecycle (register + unregister × 10 cycle) | -12248 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.02ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +8.01% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +6.74% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -13.68% |
| mean | 0.01ms | 0.01ms | +0.00ms | +7.18% |
| min | 0.00ms | 0.00ms | +0.00ms | +8.92% |
| max | 0.02ms | 0.02ms | -0.00ms | -20.17% |
| total | 0.16ms | 0.15ms | +0.01ms | +7.18% |

### schema_validate_loop (50 validateSchema)

# Perf Report — schema_validate_loop (50 validateSchema).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.12ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.15ms |
| total | 0.73ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -0.95% |
| p95 | 0.03ms | 0.03ms | +0.00ms | +10.79% |
| p99 | 0.12ms | 0.03ms | +0.08ms | +255.75% |
| mean | 0.02ms | 0.02ms | +0.00ms | +22.88% |
| min | 0.02ms | 0.02ms | -0.00ms | -0.50% |
| max | 0.15ms | 0.03ms | +0.12ms | +355.51% |
| total | 0.73ms | 0.59ms | +0.14ms | +22.88% |

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
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +4.06% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +30.45% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +67.61% |
| mean | 0.00ms | 0.00ms | +0.00ms | +5.26% |
| min | 0.00ms | 0.00ms | -0.00ms | -6.33% |
| max | 0.01ms | 0.00ms | +0.00ms | +75.69% |
| total | 0.07ms | 0.06ms | +0.00ms | +5.26% |

