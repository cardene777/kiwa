# Perf Suite — mcp-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| tool_registration_burst (server + 20 register) | 0.01ms | 30ms | PASS | stable (検知には +0.5ms (baseline 比 +1351%) 以上の悪化が必要) |
| schema_validate_loop (50 validateSchema) | 0.03ms | 30ms | PASS | stable (検知には +0.5ms (baseline 比 +2092%) 以上の悪化が必要) |
| server_lifecycle (register + unregister × 10 cycle) | 0.00ms | 30ms | PASS | stable (検知には +0.5ms (baseline 比 +23276%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| tool_registration_burst (server + 20 register) | 0.02ms | 60ms | PASS |
| schema_validate_loop (50 validateSchema) | 0.03ms | 60ms | PASS |
| server_lifecycle (register + unregister × 10 cycle) | 0.02ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| tool_registration_burst (server + 20 register) | 1144 B | 0 B | 102400 B | yes | PASS |
| schema_validate_loop (50 validateSchema) | 6680 B | 0 B | 102400 B | yes | PASS |
| server_lifecycle (register + unregister × 10 cycle) | 9288 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.01ms | -0.01ms | -60.35% |
| p95 | 0.01ms | 0.04ms | -0.02ms | -67.48% |
| p99 | 0.02ms | 0.07ms | -0.04ms | -63.89% |
| mean | 0.01ms | 0.01ms | -0.01ms | -62.65% |
| min | 0.00ms | 0.01ms | -0.00ms | -60.48% |
| max | 0.03ms | 0.08ms | -0.05ms | -64.78% |
| total | 0.15ms | 0.41ms | -0.26ms | -62.65% |

### schema_validate_loop (50 validateSchema)

# Perf Report — schema_validate_loop (50 validateSchema).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.11ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.15ms |
| total | 0.68ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -20.90% |
| p95 | 0.03ms | 0.02ms | +0.01ms | +29.50% |
| p99 | 0.11ms | 0.03ms | +0.09ms | +335.38% |
| mean | 0.02ms | 0.02ms | +0.00ms | +8.14% |
| min | 0.02ms | 0.02ms | -0.01ms | -24.74% |
| max | 0.15ms | 0.03ms | +0.12ms | +445.99% |
| total | 0.68ms | 0.63ms | +0.05ms | +8.14% |

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
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +27.14% |
| p99 | 0.01ms | 0.00ms | +0.01ms | +190.80% |
| mean | 0.00ms | 0.00ms | +0.00ms | +13.24% |
| min | 0.00ms | 0.00ms | -0.00ms | -4.20% |
| max | 0.01ms | 0.00ms | +0.01ms | +237.85% |
| total | 0.07ms | 0.06ms | +0.01ms | +13.24% |

