# Perf Suite — mcp

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| mcpListTools | 0.00063ms | 0.0024ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| mcpCallEcho | 0.00096ms | 0.0019ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| mcpCallCalc | 0.0013ms | 0.0017ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| toolRegistryRegister | 0.00025ms | 0.00033ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +116%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| mcpListTools | 0.02ms | 20ms | PASS |
| mcpCallEcho | 0.02ms | 20ms | PASS |
| mcpCallCalc | 0.02ms | 20ms | PASS |
| toolRegistryRegister | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| mcpListTools | -9312 B | 0 B | 102400 B | yes | PASS |
| mcpCallEcho | 184 B | 0 B | 102400 B | yes | PASS |
| mcpCallCalc | -14888 B | 0 B | 102400 B | yes | PASS |
| toolRegistryRegister | 10416 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### mcpListTools

# Perf Report — mcpListTools.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00063ms |
| p50 | 0.00067ms |
| p95 | 0.0024ms |
| p99 | 0.0068ms |
| mean | 0.00098ms |
| stdev | 0.0011ms |
| min | 0.00058ms |
| max | 0.0079ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00063ms | 0.00063ms | 0.00ms | 0.00% |
| p50 | 0.00067ms | 0.00071ms | -0.000042ms | -5.92% |
| p95 | 0.0024ms | 0.0026ms | -0.00019ms | -7.34% |
| p99 | 0.0068ms | 0.0065ms | +0.00028ms | +4.30% |
| mean | 0.00098ms | 0.0011ms | -0.00013ms | -11.79% |
| min | 0.00058ms | 0.00063ms | -0.000042ms | -6.72% |
| max | 0.0079ms | 0.0085ms | -0.00063ms | -7.32% |
| total | 0.20ms | 0.22ms | -0.03ms | -11.79% |

### mcpCallEcho

# Perf Report — mcpCallEcho.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00096ms |
| p50 | 0.0010ms |
| p95 | 0.0019ms |
| p99 | 0.0060ms |
| mean | 0.0013ms |
| stdev | 0.0010ms |
| min | 0.00092ms |
| max | 0.01ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00096ms | 0.00096ms | 0.00ms | 0.00% |
| p50 | 0.0010ms | 0.0010ms | -0.000042ms | -4.03% |
| p95 | 0.0019ms | 0.0017ms | +0.00026ms | +15.34% |
| p99 | 0.0060ms | 0.0047ms | +0.0013ms | +27.61% |
| mean | 0.0013ms | 0.0013ms | -0.000015ms | -1.19% |
| min | 0.00092ms | 0.00092ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.0068ms | +0.0040ms | +57.92% |
| total | 0.25ms | 0.25ms | -0.0030ms | -1.19% |

### mcpCallCalc

# Perf Report — mcpCallCalc.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0013ms |
| p50 | 0.0014ms |
| p95 | 0.0017ms |
| p99 | 0.0078ms |
| mean | 0.0015ms |
| stdev | 0.0012ms |
| min | 0.0012ms |
| max | 0.01ms |
| total | 0.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0013ms | 0.0013ms | -0.000041ms | -3.08% |
| p50 | 0.0014ms | 0.0014ms | 0.00ms | 0.00% |
| p95 | 0.0017ms | 0.0017ms | +0.000041ms | +2.46% |
| p99 | 0.0078ms | 0.0065ms | +0.0013ms | +19.32% |
| mean | 0.0015ms | 0.0015ms | +0.0000048ms | +0.32% |
| min | 0.0012ms | 0.0013ms | -0.000084ms | -6.50% |
| max | 0.01ms | 0.0090ms | +0.0051ms | +56.49% |
| total | 0.31ms | 0.31ms | +0.00097ms | +0.32% |

### toolRegistryRegister

# Perf Report — toolRegistryRegister.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00029ms |
| p95 | 0.00033ms |
| p99 | 0.0024ms |
| mean | 0.00036ms |
| stdev | 0.00041ms |
| min | 0.00025ms |
| max | 0.0042ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00029ms | -0.000037ms | -12.86% |
| p50 | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| p95 | 0.00033ms | 0.00046ms | -0.00012ms | -27.08% |
| p99 | 0.0024ms | 0.0027ms | -0.00024ms | -8.92% |
| mean | 0.00036ms | 0.00035ms | +0.0000052ms | +1.48% |
| min | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| max | 0.0042ms | 0.0030ms | +0.0012ms | +40.30% |
| total | 0.07ms | 0.07ms | +0.0010ms | +1.48% |

