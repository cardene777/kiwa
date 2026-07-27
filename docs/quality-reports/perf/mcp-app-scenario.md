# Perf Suite — mcp-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| tool_registration_burst (server + 20 register) | 0.01ms | 30ms | PASS | stable |
| schema_validate_loop (50 validateSchema) | 0.18ms | 30ms | PASS | stable |
| server_lifecycle (register + unregister × 10 cycle) | 0.00ms | 30ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| tool_registration_burst (server + 20 register) | 0.01ms | 60ms | PASS |
| schema_validate_loop (50 validateSchema) | 0.04ms | 60ms | PASS |
| server_lifecycle (register + unregister × 10 cycle) | 0.02ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| tool_registration_burst (server + 20 register) | 13400 B | -11648 B | 102400 B | yes | PASS |
| schema_validate_loop (50 validateSchema) | -10816 B | 0 B | 102400 B | yes | PASS |
| server_lifecycle (register + unregister × 10 cycle) | 3256 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### tool_registration_burst (server + 20 register)

# Perf Report — tool_registration_burst (server + 20 register).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.03ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -0.01% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +14.03% |
| p99 | 0.03ms | 0.02ms | +0.00ms | +17.56% |
| mean | 0.01ms | 0.01ms | +0.00ms | +8.46% |
| min | 0.00ms | 0.00ms | +0.00ms | +34.31% |
| max | 0.03ms | 0.02ms | +0.00ms | +16.07% |
| total | 0.17ms | 0.15ms | +0.01ms | +8.46% |

### schema_validate_loop (50 validateSchema)

# Perf Report — schema_validate_loop (50 validateSchema).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.04ms |
| p95 | 0.18ms |
| p99 | 0.27ms |
| mean | 0.05ms |
| stdev | 0.06ms |
| min | 0.02ms |
| max | 0.28ms |
| total | 1.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.02ms | +0.02ms | +122.01% |
| p95 | 0.18ms | 0.03ms | +0.15ms | +502.51% |
| p99 | 0.27ms | 0.03ms | +0.24ms | +712.33% |
| mean | 0.05ms | 0.02ms | +0.03ms | +169.15% |
| min | 0.02ms | 0.02ms | +0.00ms | +18.34% |
| max | 0.28ms | 0.03ms | +0.25ms | +735.76% |
| total | 1.60ms | 0.59ms | +1.01ms | +169.15% |

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
| max | 0.00ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +16.31% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +13.36% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +3.55% |
| mean | 0.00ms | 0.00ms | +0.00ms | +14.90% |
| min | 0.00ms | 0.00ms | +0.00ms | +19.15% |
| max | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| total | 0.07ms | 0.06ms | +0.01ms | +14.90% |

