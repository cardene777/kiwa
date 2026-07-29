# Perf Suite — mcp-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| tool_registration_burst (server + 20 register) | 0.0037ms | 0.0080ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| schema_validate_loop (50 validateSchema) | 0.02ms | 0.03ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| server_lifecycle (register + unregister × 10 cycle) | 0.0051ms | 0.02ms | 30ms | 0.00042ms | PASS | regressed — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| tool_registration_burst (server + 20 register) | 0.07ms | 60ms | PASS |
| schema_validate_loop (50 validateSchema) | 0.06ms | 60ms | PASS |
| server_lifecycle (register + unregister × 10 cycle) | 0.01ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| tool_registration_burst (server + 20 register) | -1600 B | -11335 B | 102400 B | yes | PASS |
| schema_validate_loop (50 validateSchema) | 16096 B | 0 B | 102400 B | yes | PASS |
| server_lifecycle (register + unregister × 10 cycle) | -1072 B | 0 B | 102400 B | yes | PASS |

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
| mean | 0.0050ms |
| stdev | 0.0039ms |
| min | 0.0037ms |
| max | 0.02ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0037ms | 0.0033ms | +0.00042ms | +12.48% |
| p50 | 0.0038ms | 0.0035ms | +0.00037ms | +10.84% |
| p95 | 0.0080ms | 0.0087ms | -0.00074ms | -8.43% |
| p99 | 0.02ms | 0.02ms | +0.0038ms | +23.47% |
| mean | 0.0050ms | 0.0046ms | +0.00039ms | +8.46% |
| min | 0.0037ms | 0.0033ms | +0.00042ms | +12.64% |
| max | 0.02ms | 0.02ms | +0.0055ms | +29.23% |
| total | 0.15ms | 0.14ms | +0.01ms | +8.46% |

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
| total | 0.71ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00063ms | +4.13% |
| p50 | 0.02ms | 0.02ms | +0.0022ms | +12.76% |
| p95 | 0.03ms | 0.06ms | -0.03ms | -53.16% |
| p99 | 0.10ms | 0.09ms | +0.01ms | +16.87% |
| mean | 0.02ms | 0.02ms | +0.00038ms | +1.64% |
| min | 0.02ms | 0.02ms | +0.00067ms | +4.42% |
| max | 0.13ms | 0.09ms | +0.04ms | +46.53% |
| total | 0.71ms | 0.70ms | +0.01ms | +1.64% |

### server_lifecycle (register + unregister × 10 cycle)

# Perf Report — server_lifecycle (register + unregister × 10 cycle).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0051ms |
| p50 | 0.0054ms |
| p95 | 0.02ms |
| p99 | 0.10ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.0050ms |
| max | 0.13ms |
| total | 0.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0051ms | 0.0020ms | +0.0031ms | +156.04% |
| p50 | 0.0054ms | 0.0021ms | +0.0033ms | +158.04% |
| p95 | 0.02ms | 0.0059ms | +0.01ms | +231.26% |
| p99 | 0.10ms | 0.05ms | +0.05ms | +91.23% |
| mean | 0.01ms | 0.0053ms | +0.0057ms | +107.38% |
| min | 0.0050ms | 0.0020ms | +0.0030ms | +152.10% |
| max | 0.13ms | 0.07ms | +0.06ms | +86.21% |
| total | 0.33ms | 0.16ms | +0.17ms | +107.38% |

