# Perf Suite — mcp-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| tool_registration_burst (server + 20 register) | 0.0033ms | 0.0087ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| schema_validate_loop (50 validateSchema) | 0.01ms | 0.04ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| server_lifecycle (register + unregister × 10 cycle) | 0.0020ms | 0.0020ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| tool_registration_burst (server + 20 register) | 0.01ms | 60ms | PASS |
| schema_validate_loop (50 validateSchema) | 0.03ms | 60ms | PASS |
| server_lifecycle (register + unregister × 10 cycle) | 0.02ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| tool_registration_burst (server + 20 register) | 2712 B | 0 B | 102400 B | yes | PASS |
| schema_validate_loop (50 validateSchema) | 6752 B | 0 B | 102400 B | yes | PASS |
| server_lifecycle (register + unregister × 10 cycle) | 9256 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### tool_registration_burst (server + 20 register)

# Perf Report — tool_registration_burst (server + 20 register).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0033ms |
| p50 | 0.0034ms |
| p95 | 0.0087ms |
| p99 | 0.02ms |
| mean | 0.0047ms |
| stdev | 0.0034ms |
| min | 0.0032ms |
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0033ms | 0.0033ms | -0.000046ms | -1.38% |
| p50 | 0.0034ms | 0.0035ms | -0.000041ms | -1.19% |
| p95 | 0.0087ms | 0.0087ms | +0.000010ms | +0.12% |
| p99 | 0.02ms | 0.02ms | +0.0010ms | +6.34% |
| mean | 0.0047ms | 0.0046ms | +0.000072ms | +1.58% |
| min | 0.0032ms | 0.0033ms | -0.000084ms | -2.55% |
| max | 0.02ms | 0.02ms | +0.0018ms | +9.45% |
| total | 0.14ms | 0.14ms | +0.0022ms | +1.58% |

### schema_validate_loop (50 validateSchema)

# Perf Report — schema_validate_loop (50 validateSchema).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.09ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.0076ms |
| max | 0.11ms |
| total | 0.70ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.00049ms | -3.18% |
| p50 | 0.02ms | 0.02ms | +0.0018ms | +10.80% |
| p95 | 0.04ms | 0.06ms | -0.02ms | -32.07% |
| p99 | 0.09ms | 0.09ms | +0.0087ms | +10.11% |
| mean | 0.02ms | 0.02ms | +0.000051ms | +0.22% |
| min | 0.0076ms | 0.02ms | -0.0075ms | -49.73% |
| max | 0.11ms | 0.09ms | +0.03ms | +28.83% |
| total | 0.70ms | 0.70ms | +0.0015ms | +0.22% |

### server_lifecycle (register + unregister × 10 cycle)

# Perf Report — server_lifecycle (register + unregister × 10 cycle).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0020ms |
| p50 | 0.0020ms |
| p95 | 0.0020ms |
| p99 | 0.0022ms |
| mean | 0.0020ms |
| stdev | 0.000070ms |
| min | 0.0020ms |
| max | 0.0023ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0020ms | 0.0020ms | -0.000042ms | -2.10% |
| p50 | 0.0020ms | 0.0021ms | -0.00012ms | -5.95% |
| p95 | 0.0020ms | 0.0059ms | -0.0039ms | -65.89% |
| p99 | 0.0022ms | 0.05ms | -0.05ms | -95.75% |
| mean | 0.0020ms | 0.0053ms | -0.0033ms | -62.47% |
| min | 0.0020ms | 0.0020ms | -0.000042ms | -2.10% |
| max | 0.0023ms | 0.07ms | -0.07ms | -96.75% |
| total | 0.06ms | 0.16ms | -0.10ms | -62.47% |

