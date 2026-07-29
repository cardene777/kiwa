# Perf Suite — mcp-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| tool_registration_burst (server + 20 register) | 0.0033ms | 0.0090ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| schema_validate_loop (50 validateSchema) | 0.01ms | 0.03ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| server_lifecycle (register + unregister × 10 cycle) | 0.0020ms | 0.0024ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| tool_registration_burst (server + 20 register) | 0.01ms | 60ms | PASS |
| schema_validate_loop (50 validateSchema) | 0.03ms | 60ms | PASS |
| server_lifecycle (register + unregister × 10 cycle) | 0.02ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| tool_registration_burst (server + 20 register) | 2112 B | 0 B | 102400 B | yes | PASS |
| schema_validate_loop (50 validateSchema) | 6864 B | 0 B | 102400 B | yes | PASS |
| server_lifecycle (register + unregister × 10 cycle) | 9696 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### tool_registration_burst (server + 20 register)

# Perf Report — tool_registration_burst (server + 20 register).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0033ms |
| p50 | 0.0035ms |
| p95 | 0.0090ms |
| p99 | 0.02ms |
| mean | 0.0049ms |
| stdev | 0.0040ms |
| min | 0.0033ms |
| max | 0.02ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0033ms | 0.0033ms | 0.00ms | 0.00% |
| p50 | 0.0035ms | 0.0035ms | +0.000042ms | +1.21% |
| p95 | 0.0090ms | 0.0087ms | +0.00028ms | +3.20% |
| p99 | 0.02ms | 0.02ms | +0.0036ms | +22.26% |
| mean | 0.0049ms | 0.0046ms | +0.00036ms | +7.79% |
| min | 0.0033ms | 0.0033ms | +0.000041ms | +1.25% |
| max | 0.02ms | 0.02ms | +0.0053ms | +28.14% |
| total | 0.15ms | 0.14ms | +0.01ms | +7.79% |

### schema_validate_loop (50 validateSchema)

# Perf Report — schema_validate_loop (50 validateSchema).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.07ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.09ms |
| total | 0.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.00090ms | -5.90% |
| p50 | 0.02ms | 0.02ms | +0.000022ms | +0.13% |
| p95 | 0.03ms | 0.06ms | -0.03ms | -55.38% |
| p99 | 0.07ms | 0.09ms | -0.01ms | -13.37% |
| mean | 0.02ms | 0.02ms | -0.0025ms | -10.59% |
| min | 0.01ms | 0.02ms | -0.00079ms | -5.25% |
| max | 0.09ms | 0.09ms | +0.0052ms | +5.82% |
| total | 0.62ms | 0.70ms | -0.07ms | -10.59% |

### server_lifecycle (register + unregister × 10 cycle)

# Perf Report — server_lifecycle (register + unregister × 10 cycle).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0020ms |
| p50 | 0.0020ms |
| p95 | 0.0024ms |
| p99 | 0.0026ms |
| mean | 0.0021ms |
| stdev | 0.00015ms |
| min | 0.0020ms |
| max | 0.0026ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0020ms | 0.0020ms | -0.000042ms | -2.10% |
| p50 | 0.0020ms | 0.0021ms | -0.000083ms | -3.98% |
| p95 | 0.0024ms | 0.0059ms | -0.0035ms | -58.80% |
| p99 | 0.0026ms | 0.05ms | -0.05ms | -95.16% |
| mean | 0.0021ms | 0.0053ms | -0.0032ms | -61.13% |
| min | 0.0020ms | 0.0020ms | -0.000042ms | -2.10% |
| max | 0.0026ms | 0.07ms | -0.07ms | -96.41% |
| total | 0.06ms | 0.16ms | -0.10ms | -61.13% |

