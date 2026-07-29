# Perf Suite — mcp

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| mcpListTools | 0.00063ms | 0.0025ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| mcpCallEcho | 0.00096ms | 0.0017ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| mcpCallCalc | 0.0013ms | 0.0018ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| toolRegistryRegister | 0.00029ms | 0.00038ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +116%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| mcpListTools | 0.03ms | 20ms | PASS |
| mcpCallEcho | 0.02ms | 20ms | PASS |
| mcpCallCalc | 0.03ms | 20ms | PASS |
| toolRegistryRegister | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| mcpListTools | 182192 B | 0 B | 102400 B | yes | PASS |
| mcpCallEcho | 4136 B | 0 B | 102400 B | yes | PASS |
| mcpCallCalc | 440 B | 0 B | 102400 B | yes | PASS |
| toolRegistryRegister | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### mcpListTools

# Perf Report — mcpListTools.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00063ms |
| p50 | 0.00071ms |
| p95 | 0.0025ms |
| p99 | 0.0064ms |
| mean | 0.0010ms |
| stdev | 0.0013ms |
| min | 0.00058ms |
| max | 0.01ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00063ms | 0.00063ms | 0.00ms | 0.00% |
| p50 | 0.00071ms | 0.00071ms | -0.0000010ms | -0.14% |
| p95 | 0.0025ms | 0.0026ms | -0.00016ms | -6.04% |
| p99 | 0.0064ms | 0.0065ms | -0.00014ms | -2.08% |
| mean | 0.0010ms | 0.0011ms | -0.00012ms | -10.50% |
| min | 0.00058ms | 0.00063ms | -0.000041ms | -6.56% |
| max | 0.01ms | 0.0085ms | +0.0060ms | +69.77% |
| total | 0.20ms | 0.22ms | -0.02ms | -10.50% |

### mcpCallEcho

# Perf Report — mcpCallEcho.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00096ms |
| p50 | 0.0010ms |
| p95 | 0.0017ms |
| p99 | 0.0054ms |
| mean | 0.0012ms |
| stdev | 0.00093ms |
| min | 0.00096ms |
| max | 0.01ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00096ms | 0.00096ms | 0.00ms | 0.00% |
| p50 | 0.0010ms | 0.0010ms | -0.000042ms | -4.03% |
| p95 | 0.0017ms | 0.0017ms | +0.000035ms | +2.07% |
| p99 | 0.0054ms | 0.0047ms | +0.00075ms | +16.14% |
| mean | 0.0012ms | 0.0013ms | -0.000019ms | -1.49% |
| min | 0.00096ms | 0.00092ms | +0.000042ms | +4.59% |
| max | 0.01ms | 0.0068ms | +0.0032ms | +46.35% |
| total | 0.25ms | 0.25ms | -0.0038ms | -1.49% |

### mcpCallCalc

# Perf Report — mcpCallCalc.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0013ms |
| p50 | 0.0013ms |
| p95 | 0.0018ms |
| p99 | 0.0082ms |
| mean | 0.0015ms |
| stdev | 0.0012ms |
| min | 0.0012ms |
| max | 0.01ms |
| total | 0.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0013ms | 0.0013ms | -0.000042ms | -3.15% |
| p50 | 0.0013ms | 0.0014ms | -0.000042ms | -3.05% |
| p95 | 0.0018ms | 0.0017ms | +0.00012ms | +7.50% |
| p99 | 0.0082ms | 0.0065ms | +0.0017ms | +25.77% |
| mean | 0.0015ms | 0.0015ms | -3.9e-7ms | -0.03% |
| min | 0.0012ms | 0.0013ms | -0.000084ms | -6.50% |
| max | 0.01ms | 0.0090ms | +0.0052ms | +57.40% |
| total | 0.31ms | 0.31ms | -0.000078ms | -0.03% |

### toolRegistryRegister

# Perf Report — toolRegistryRegister.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00029ms |
| p95 | 0.00038ms |
| p99 | 0.0028ms |
| mean | 0.00036ms |
| stdev | 0.00041ms |
| min | 0.00025ms |
| max | 0.0042ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00029ms | +0.0000041ms | +1.43% |
| p50 | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| p95 | 0.00038ms | 0.00046ms | -0.000083ms | -18.13% |
| p99 | 0.0028ms | 0.0027ms | +0.000092ms | +3.45% |
| mean | 0.00036ms | 0.00035ms | +0.0000073ms | +2.07% |
| min | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| max | 0.0042ms | 0.0030ms | +0.0012ms | +38.90% |
| total | 0.07ms | 0.07ms | +0.0015ms | +2.07% |

