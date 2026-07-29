# Perf Suite — mcp-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| tool_registration_burst (server + 20 register) | 0.0037ms | 0.0080ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| schema_validate_loop (50 validateSchema) | 0.02ms | 0.03ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| server_lifecycle (register + unregister × 10 cycle) | 0.0021ms | 0.0023ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| tool_registration_burst (server + 20 register) | 0.01ms | 60ms | PASS |
| schema_validate_loop (50 validateSchema) | 0.06ms | 60ms | PASS |
| server_lifecycle (register + unregister × 10 cycle) | 0.02ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| tool_registration_burst (server + 20 register) | 9784 B | -11319 B | 102400 B | yes | PASS |
| schema_validate_loop (50 validateSchema) | 18016 B | 0 B | 102400 B | yes | PASS |
| server_lifecycle (register + unregister × 10 cycle) | 11840 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### tool_registration_burst (server + 20 register)

# Perf Report — tool_registration_burst (server + 20 register).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0037ms |
| p50 | 0.0038ms |
| p95 | 0.0080ms |
| p99 | 0.02ms |
| mean | 0.0049ms |
| stdev | 0.0039ms |
| min | 0.0036ms |
| max | 0.02ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0037ms | 0.0033ms | +0.00033ms | +9.99% |
| p50 | 0.0038ms | 0.0035ms | +0.00033ms | +9.66% |
| p95 | 0.0080ms | 0.0087ms | -0.00073ms | -8.31% |
| p99 | 0.02ms | 0.02ms | +0.0037ms | +22.95% |
| mean | 0.0049ms | 0.0046ms | +0.00034ms | +7.43% |
| min | 0.0036ms | 0.0033ms | +0.00033ms | +10.12% |
| max | 0.02ms | 0.02ms | +0.0055ms | +28.79% |
| total | 0.15ms | 0.14ms | +0.01ms | +7.43% |

### schema_validate_loop (50 validateSchema)

# Perf Report — schema_validate_loop (50 validateSchema).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.12ms |
| mean | 0.02ms |
| stdev | 0.03ms |
| min | 0.01ms |
| max | 0.16ms |
| total | 0.72ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00028ms | -1.82% |
| p50 | 0.02ms | 0.02ms | +0.00054ms | +3.19% |
| p95 | 0.03ms | 0.06ms | -0.03ms | -51.48% |
| p99 | 0.12ms | 0.09ms | +0.04ms | +45.35% |
| mean | 0.02ms | 0.02ms | +0.00074ms | +3.18% |
| min | 0.01ms | 0.02ms | -0.00025ms | -1.66% |
| max | 0.16ms | 0.09ms | +0.08ms | +85.30% |
| total | 0.72ms | 0.70ms | +0.02ms | +3.18% |

### server_lifecycle (register + unregister × 10 cycle)

# Perf Report — server_lifecycle (register + unregister × 10 cycle).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0021ms |
| p50 | 0.0022ms |
| p95 | 0.0023ms |
| p99 | 0.0026ms |
| mean | 0.0022ms |
| stdev | 0.00011ms |
| min | 0.0021ms |
| max | 0.0027ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0021ms | 0.0020ms | +0.00013ms | +6.25% |
| p50 | 0.0022ms | 0.0021ms | +0.000084ms | +4.03% |
| p95 | 0.0023ms | 0.0059ms | -0.0036ms | -61.36% |
| p99 | 0.0026ms | 0.05ms | -0.05ms | -95.11% |
| mean | 0.0022ms | 0.0053ms | -0.0031ms | -58.21% |
| min | 0.0021ms | 0.0020ms | +0.00013ms | +6.25% |
| max | 0.0027ms | 0.07ms | -0.07ms | -96.23% |
| total | 0.07ms | 0.16ms | -0.09ms | -58.21% |

