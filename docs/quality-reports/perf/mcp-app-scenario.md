# Perf Suite — mcp-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| tool_registration_burst (server + 20 register) | 0.0033ms | 0.0092ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| schema_validate_loop (50 validateSchema) | 0.02ms | 0.04ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| server_lifecycle (register + unregister × 10 cycle) | 0.0020ms | 0.0023ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| tool_registration_burst (server + 20 register) | 0.01ms | 60ms | PASS |
| schema_validate_loop (50 validateSchema) | 0.03ms | 60ms | PASS |
| server_lifecycle (register + unregister × 10 cycle) | 0.02ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| tool_registration_burst (server + 20 register) | 1048 B | 0 B | 102400 B | yes | PASS |
| schema_validate_loop (50 validateSchema) | 6752 B | 0 B | 102400 B | yes | PASS |
| server_lifecycle (register + unregister × 10 cycle) | 9560 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### tool_registration_burst (server + 20 register)

# Perf Report — tool_registration_burst (server + 20 register).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0033ms |
| p50 | 0.0033ms |
| p95 | 0.0092ms |
| p99 | 0.02ms |
| mean | 0.0046ms |
| stdev | 0.0036ms |
| min | 0.0032ms |
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0033ms | 0.0033ms | -0.000047ms | -1.41% |
| p50 | 0.0033ms | 0.0035ms | -0.00012ms | -3.59% |
| p95 | 0.0092ms | 0.0087ms | +0.00050ms | +5.78% |
| p99 | 0.02ms | 0.02ms | +0.0023ms | +14.02% |
| mean | 0.0046ms | 0.0046ms | -0.000014ms | -0.30% |
| min | 0.0032ms | 0.0033ms | -0.000084ms | -2.55% |
| max | 0.02ms | 0.02ms | +0.0024ms | +12.53% |
| total | 0.14ms | 0.14ms | -0.00041ms | -0.30% |

### schema_validate_loop (50 validateSchema)

# Perf Report — schema_validate_loop (50 validateSchema).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.11ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.13ms |
| total | 0.73ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00020ms | -1.28% |
| p50 | 0.02ms | 0.02ms | +0.0021ms | +12.27% |
| p95 | 0.04ms | 0.06ms | -0.01ms | -26.04% |
| p99 | 0.11ms | 0.09ms | +0.02ms | +28.48% |
| mean | 0.02ms | 0.02ms | +0.0010ms | +4.33% |
| min | 0.02ms | 0.02ms | -0.000043ms | -0.29% |
| max | 0.13ms | 0.09ms | +0.05ms | +50.99% |
| total | 0.73ms | 0.70ms | +0.03ms | +4.33% |

### server_lifecycle (register + unregister × 10 cycle)

# Perf Report — server_lifecycle (register + unregister × 10 cycle).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0020ms |
| p50 | 0.0020ms |
| p95 | 0.0023ms |
| p99 | 0.0027ms |
| mean | 0.0020ms |
| stdev | 0.00018ms |
| min | 0.0019ms |
| max | 0.0029ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0020ms | 0.0020ms | -0.000042ms | -2.10% |
| p50 | 0.0020ms | 0.0021ms | -0.000083ms | -3.98% |
| p95 | 0.0023ms | 0.0059ms | -0.0037ms | -61.62% |
| p99 | 0.0027ms | 0.05ms | -0.05ms | -94.80% |
| mean | 0.0020ms | 0.0053ms | -0.0032ms | -61.26% |
| min | 0.0019ms | 0.0020ms | -0.000083ms | -4.15% |
| max | 0.0029ms | 0.07ms | -0.07ms | -95.94% |
| total | 0.06ms | 0.16ms | -0.10ms | -61.26% |

