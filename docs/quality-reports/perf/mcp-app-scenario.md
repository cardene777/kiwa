# Perf Suite — mcp-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| tool_registration_burst (server + 20 register) | 0.0034ms | 0.03ms | 30ms | 0.00042ms | PASS | stable (p10 +1% (閾値未満)、 p95 +189% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| schema_validate_loop (50 validateSchema) | 0.02ms | 0.05ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| server_lifecycle (register + unregister × 10 cycle) | 0.0020ms | 0.0027ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| tool_registration_burst (server + 20 register) | 0.01ms | 60ms | PASS |
| schema_validate_loop (50 validateSchema) | 0.03ms | 60ms | PASS |
| server_lifecycle (register + unregister × 10 cycle) | 0.02ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| tool_registration_burst (server + 20 register) | 6544 B | 0 B | 102400 B | yes | PASS |
| schema_validate_loop (50 validateSchema) | -6552 B | 0 B | 102400 B | yes | PASS |
| server_lifecycle (register + unregister × 10 cycle) | 7792 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### tool_registration_burst (server + 20 register)

# Perf Report — tool_registration_burst (server + 20 register).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0034ms |
| p50 | 0.0037ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.0067ms |
| stdev | 0.0076ms |
| min | 0.0033ms |
| max | 0.03ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0034ms | 0.0033ms | +0.000041ms | +1.23% |
| p50 | 0.0037ms | 0.0035ms | +0.00025ms | +7.23% |
| p95 | 0.03ms | 0.0087ms | +0.02ms | +189.26% |
| p99 | 0.03ms | 0.02ms | +0.02ms | +101.54% |
| mean | 0.0067ms | 0.0046ms | +0.0021ms | +46.47% |
| min | 0.0033ms | 0.0033ms | +0.000041ms | +1.25% |
| max | 0.03ms | 0.02ms | +0.01ms | +76.27% |
| total | 0.20ms | 0.14ms | +0.06ms | +46.47% |

### schema_validate_loop (50 validateSchema)

# Perf Report — schema_validate_loop (50 validateSchema).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.05ms |
| p99 | 0.13ms |
| mean | 0.03ms |
| stdev | 0.03ms |
| min | 0.02ms |
| max | 0.16ms |
| total | 0.75ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00088ms | +5.74% |
| p50 | 0.02ms | 0.02ms | +0.00079ms | +4.66% |
| p95 | 0.05ms | 0.06ms | -0.01ms | -18.86% |
| p99 | 0.13ms | 0.09ms | +0.04ms | +48.61% |
| mean | 0.03ms | 0.02ms | +0.0019ms | +8.10% |
| min | 0.02ms | 0.02ms | +0.00067ms | +4.42% |
| max | 0.16ms | 0.09ms | +0.07ms | +74.74% |
| total | 0.75ms | 0.70ms | +0.06ms | +8.10% |

### server_lifecycle (register + unregister × 10 cycle)

# Perf Report — server_lifecycle (register + unregister × 10 cycle).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0020ms |
| p50 | 0.0020ms |
| p95 | 0.0027ms |
| p99 | 0.01ms |
| mean | 0.0024ms |
| stdev | 0.0021ms |
| min | 0.0020ms |
| max | 0.01ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0020ms | 0.0020ms | -0.000042ms | -2.10% |
| p50 | 0.0020ms | 0.0021ms | -0.000083ms | -3.98% |
| p95 | 0.0027ms | 0.0059ms | -0.0032ms | -54.75% |
| p99 | 0.01ms | 0.05ms | -0.04ms | -80.15% |
| mean | 0.0024ms | 0.0053ms | -0.0029ms | -54.09% |
| min | 0.0020ms | 0.0020ms | -0.000042ms | -2.10% |
| max | 0.01ms | 0.07ms | -0.06ms | -81.05% |
| total | 0.07ms | 0.16ms | -0.09ms | -54.09% |

