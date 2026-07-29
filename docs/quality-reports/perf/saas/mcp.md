# Perf Suite — mcp

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| mcpListTools | 0.00063ms | 0.0023ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| mcpCallEcho | 0.00096ms | 0.0018ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| mcpCallCalc | 0.0013ms | 0.0018ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| toolRegistryRegister | 0.00025ms | 0.00034ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +116%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

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
| mcpListTools | -12992 B | 0 B | 102400 B | yes | PASS |
| mcpCallEcho | -40 B | 0 B | 102400 B | yes | PASS |
| mcpCallCalc | 712 B | 0 B | 102400 B | yes | PASS |
| toolRegistryRegister | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### mcpListTools

# Perf Report — mcpListTools.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00063ms |
| p50 | 0.00075ms |
| p95 | 0.0023ms |
| p99 | 0.0059ms |
| mean | 0.00096ms |
| stdev | 0.00096ms |
| min | 0.00058ms |
| max | 0.0070ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00063ms | 0.00063ms | 0.00ms | 0.00% |
| p50 | 0.00075ms | 0.00071ms | +0.000041ms | +5.78% |
| p95 | 0.0023ms | 0.0026ms | -0.00033ms | -12.77% |
| p99 | 0.0059ms | 0.0065ms | -0.00064ms | -9.78% |
| mean | 0.00096ms | 0.0011ms | -0.00015ms | -13.68% |
| min | 0.00058ms | 0.00063ms | -0.000042ms | -6.72% |
| max | 0.0070ms | 0.0085ms | -0.0015ms | -18.04% |
| total | 0.19ms | 0.22ms | -0.03ms | -13.68% |

### mcpCallEcho

# Perf Report — mcpCallEcho.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00096ms |
| p50 | 0.0010ms |
| p95 | 0.0018ms |
| p99 | 0.0056ms |
| mean | 0.0012ms |
| stdev | 0.00090ms |
| min | 0.00092ms |
| max | 0.0097ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00096ms | 0.00096ms | 0.00ms | 0.00% |
| p50 | 0.0010ms | 0.0010ms | -0.000042ms | -4.03% |
| p95 | 0.0018ms | 0.0017ms | +0.00013ms | +7.80% |
| p99 | 0.0056ms | 0.0047ms | +0.00091ms | +19.45% |
| mean | 0.0012ms | 0.0013ms | -0.000019ms | -1.50% |
| min | 0.00092ms | 0.00092ms | 0.00ms | 0.00% |
| max | 0.0097ms | 0.0068ms | +0.0029ms | +42.09% |
| total | 0.25ms | 0.25ms | -0.0038ms | -1.50% |

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
| mean | 0.0022ms |
| stdev | 0.0096ms |
| min | 0.0012ms |
| max | 0.14ms |
| total | 0.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0013ms | 0.0013ms | -0.000083ms | -6.23% |
| p50 | 0.0013ms | 0.0014ms | -0.000083ms | -6.04% |
| p95 | 0.0018ms | 0.0017ms | +0.000087ms | +5.23% |
| p99 | 0.01ms | 0.0065ms | +0.0037ms | +56.84% |
| mean | 0.0022ms | 0.0015ms | +0.00065ms | +42.63% |
| min | 0.0012ms | 0.0013ms | -0.000084ms | -6.50% |
| max | 0.14ms | 0.0090ms | +0.13ms | +1412.96% |
| total | 0.44ms | 0.31ms | +0.13ms | +42.63% |

### toolRegistryRegister

# Perf Report — toolRegistryRegister.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00029ms |
| p95 | 0.00034ms |
| p99 | 0.0027ms |
| mean | 0.00035ms |
| stdev | 0.00040ms |
| min | 0.00025ms |
| max | 0.0037ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00029ms | -0.000037ms | -12.86% |
| p50 | 0.00029ms | 0.00029ms | -5.0e-7ms | -0.17% |
| p95 | 0.00034ms | 0.00046ms | -0.00012ms | -26.63% |
| p99 | 0.0027ms | 0.0027ms | +0.000052ms | +1.96% |
| mean | 0.00035ms | 0.00035ms | -0.0000032ms | -0.90% |
| min | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| max | 0.0037ms | 0.0030ms | +0.00075ms | +25.00% |
| total | 0.07ms | 0.07ms | -0.00063ms | -0.90% |

