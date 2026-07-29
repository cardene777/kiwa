# Perf Suite — mcp-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| tool_registration_burst (server + 20 register) | 0.0033ms | 0.0096ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| schema_validate_loop (50 validateSchema) | 0.02ms | 0.03ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| server_lifecycle (register + unregister × 10 cycle) | 0.0019ms | 0.0040ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| tool_registration_burst (server + 20 register) | 0.01ms | 60ms | PASS |
| schema_validate_loop (50 validateSchema) | 0.03ms | 60ms | PASS |
| server_lifecycle (register + unregister × 10 cycle) | 0.02ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| tool_registration_burst (server + 20 register) | 1640 B | 0 B | 102400 B | yes | PASS |
| schema_validate_loop (50 validateSchema) | 6976 B | 0 B | 102400 B | yes | PASS |
| server_lifecycle (register + unregister × 10 cycle) | 9256 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### tool_registration_burst (server + 20 register)

# Perf Report — tool_registration_burst (server + 20 register).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0033ms |
| p50 | 0.0035ms |
| p95 | 0.0096ms |
| p99 | 0.02ms |
| mean | 0.0049ms |
| stdev | 0.0044ms |
| min | 0.0033ms |
| max | 0.03ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0033ms | 0.0033ms | 0.00ms | 0.00% |
| p50 | 0.0035ms | 0.0035ms | 0.00ms | 0.00% |
| p95 | 0.0096ms | 0.0087ms | +0.00092ms | +10.60% |
| p99 | 0.02ms | 0.02ms | +0.0059ms | +36.32% |
| mean | 0.0049ms | 0.0046ms | +0.00032ms | +7.00% |
| min | 0.0033ms | 0.0033ms | +0.000041ms | +1.25% |
| max | 0.03ms | 0.02ms | +0.0073ms | +38.46% |
| total | 0.15ms | 0.14ms | +0.0096ms | +7.00% |

### schema_validate_loop (50 validateSchema)

# Perf Report — schema_validate_loop (50 validateSchema).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.10ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.13ms |
| total | 0.73ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00089ms | +5.79% |
| p50 | 0.02ms | 0.02ms | +0.0020ms | +12.03% |
| p95 | 0.03ms | 0.06ms | -0.02ms | -43.20% |
| p99 | 0.10ms | 0.09ms | +0.02ms | +17.51% |
| mean | 0.02ms | 0.02ms | +0.0010ms | +4.42% |
| min | 0.02ms | 0.02ms | +0.00033ms | +2.21% |
| max | 0.13ms | 0.09ms | +0.04ms | +45.07% |
| total | 0.73ms | 0.70ms | +0.03ms | +4.42% |

### server_lifecycle (register + unregister × 10 cycle)

# Perf Report — server_lifecycle (register + unregister × 10 cycle).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0019ms |
| p50 | 0.0019ms |
| p95 | 0.0040ms |
| p99 | 0.0066ms |
| mean | 0.0022ms |
| stdev | 0.0011ms |
| min | 0.0019ms |
| max | 0.0073ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0019ms | 0.0020ms | -0.000084ms | -4.20% |
| p50 | 0.0019ms | 0.0021ms | -0.00015ms | -6.99% |
| p95 | 0.0040ms | 0.0059ms | -0.0020ms | -33.33% |
| p99 | 0.0066ms | 0.05ms | -0.05ms | -87.50% |
| mean | 0.0022ms | 0.0053ms | -0.0031ms | -57.72% |
| min | 0.0019ms | 0.0020ms | -0.00013ms | -6.25% |
| max | 0.0073ms | 0.07ms | -0.06ms | -89.92% |
| total | 0.07ms | 0.16ms | -0.09ms | -57.72% |

