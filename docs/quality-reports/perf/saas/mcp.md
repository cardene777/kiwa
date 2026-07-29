# Perf Suite — mcp

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| mcpListTools | 0.00058ms | 0.0027ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| mcpCallEcho | 0.00092ms | 0.0019ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| mcpCallCalc | 0.0013ms | 0.0018ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| toolRegistryRegister | 0.00025ms | 0.00038ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +116%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| mcpListTools | 0.02ms | 20ms | PASS |
| mcpCallEcho | 0.02ms | 20ms | PASS |
| mcpCallCalc | 0.02ms | 20ms | PASS |
| toolRegistryRegister | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| mcpListTools | 369928 B | 0 B | 102400 B | yes | PASS |
| mcpCallEcho | -504 B | 0 B | 102400 B | yes | PASS |
| mcpCallCalc | 25440 B | 0 B | 102400 B | yes | PASS |
| toolRegistryRegister | -424 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### mcpListTools

# Perf Report — mcpListTools.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.00071ms |
| p95 | 0.0027ms |
| p99 | 0.0069ms |
| mean | 0.0011ms |
| stdev | 0.0011ms |
| min | 0.00054ms |
| max | 0.0081ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00058ms | 0.00063ms | -0.000041ms | -6.56% |
| p50 | 0.00071ms | 0.00071ms | -0.0000010ms | -0.14% |
| p95 | 0.0027ms | 0.0026ms | +0.000064ms | +2.46% |
| p99 | 0.0069ms | 0.0065ms | +0.00041ms | +6.29% |
| mean | 0.0011ms | 0.0011ms | -0.000023ms | -2.06% |
| min | 0.00054ms | 0.00063ms | -0.000083ms | -13.28% |
| max | 0.0081ms | 0.0085ms | -0.00042ms | -4.87% |
| total | 0.22ms | 0.22ms | -0.0046ms | -2.06% |

### mcpCallEcho

# Perf Report — mcpCallEcho.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00092ms |
| p50 | 0.00096ms |
| p95 | 0.0019ms |
| p99 | 0.0048ms |
| mean | 0.0012ms |
| stdev | 0.00093ms |
| min | 0.00092ms |
| max | 0.01ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00092ms | 0.00096ms | -0.000041ms | -4.28% |
| p50 | 0.00096ms | 0.0010ms | -0.000083ms | -7.97% |
| p95 | 0.0019ms | 0.0017ms | +0.00025ms | +14.85% |
| p99 | 0.0048ms | 0.0047ms | +0.00017ms | +3.64% |
| mean | 0.0012ms | 0.0013ms | -0.000046ms | -3.62% |
| min | 0.00092ms | 0.00092ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.0068ms | +0.0034ms | +49.39% |
| total | 0.24ms | 0.25ms | -0.0092ms | -3.62% |

### mcpCallCalc

# Perf Report — mcpCallCalc.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0013ms |
| p50 | 0.0013ms |
| p95 | 0.0018ms |
| p99 | 0.01ms |
| mean | 0.0018ms |
| stdev | 0.0050ms |
| min | 0.0013ms |
| max | 0.07ms |
| total | 0.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0013ms | 0.0013ms | -0.000083ms | -6.23% |
| p50 | 0.0013ms | 0.0014ms | -0.000042ms | -3.05% |
| p95 | 0.0018ms | 0.0017ms | +0.00017ms | +9.96% |
| p99 | 0.01ms | 0.0065ms | +0.0039ms | +59.60% |
| mean | 0.0018ms | 0.0015ms | +0.00031ms | +20.34% |
| min | 0.0013ms | 0.0013ms | -0.000042ms | -3.25% |
| max | 0.07ms | 0.0090ms | +0.06ms | +686.11% |
| total | 0.37ms | 0.31ms | +0.06ms | +20.34% |

### toolRegistryRegister

# Perf Report — toolRegistryRegister.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00029ms |
| p95 | 0.00038ms |
| p99 | 0.0024ms |
| mean | 0.00035ms |
| stdev | 0.00040ms |
| min | 0.00025ms |
| max | 0.0040ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00029ms | -0.000037ms | -12.86% |
| p50 | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| p95 | 0.00038ms | 0.00046ms | -0.000083ms | -18.13% |
| p99 | 0.0024ms | 0.0027ms | -0.00024ms | -8.90% |
| mean | 0.00035ms | 0.00035ms | -0.0000057ms | -1.61% |
| min | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| max | 0.0040ms | 0.0030ms | +0.0010ms | +33.33% |
| total | 0.07ms | 0.07ms | -0.0011ms | -1.61% |

