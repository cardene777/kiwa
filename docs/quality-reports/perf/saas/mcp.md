# Perf Suite — mcp

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| mcpListTools | 0.00067ms | 0.0024ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| mcpCallEcho | 0.0013ms | 0.0018ms | 10ms | 0.00033ms | PASS | stable (差 0.00029ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| mcpCallCalc | 0.0013ms | 0.0018ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| toolRegistryRegister | 0.00025ms | 0.00033ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +116%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

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
| mcpListTools | 288928 B | 0 B | 102400 B | yes | PASS |
| mcpCallEcho | 32952 B | 0 B | 102400 B | yes | PASS |
| mcpCallCalc | 840 B | 0 B | 102400 B | yes | PASS |
| toolRegistryRegister | 744 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### mcpListTools

# Perf Report — mcpListTools.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00067ms |
| p50 | 0.00083ms |
| p95 | 0.0024ms |
| p99 | 0.0075ms |
| mean | 0.0011ms |
| stdev | 0.0012ms |
| min | 0.00063ms |
| max | 0.0096ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00067ms | 0.00063ms | +0.000042ms | +6.72% |
| p50 | 0.00083ms | 0.00071ms | +0.00012ms | +17.49% |
| p95 | 0.0024ms | 0.0026ms | -0.00022ms | -8.45% |
| p99 | 0.0075ms | 0.0065ms | +0.00095ms | +14.61% |
| mean | 0.0011ms | 0.0011ms | +0.000023ms | +2.08% |
| min | 0.00063ms | 0.00063ms | 0.00ms | 0.00% |
| max | 0.0096ms | 0.0085ms | +0.0010ms | +12.20% |
| total | 0.23ms | 0.22ms | +0.0046ms | +2.08% |

### mcpCallEcho

# Perf Report — mcpCallEcho.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0013ms |
| p50 | 0.0013ms |
| p95 | 0.0018ms |
| p99 | 0.0051ms |
| mean | 0.0015ms |
| stdev | 0.00093ms |
| min | 0.0012ms |
| max | 0.01ms |
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0013ms | 0.00096ms | +0.00029ms | +30.48% |
| p50 | 0.0013ms | 0.0010ms | +0.00027ms | +25.96% |
| p95 | 0.0018ms | 0.0017ms | +0.000068ms | +4.06% |
| p99 | 0.0051ms | 0.0047ms | +0.00043ms | +9.15% |
| mean | 0.0015ms | 0.0013ms | +0.00021ms | +16.21% |
| min | 0.0012ms | 0.00092ms | +0.00029ms | +31.99% |
| max | 0.01ms | 0.0068ms | +0.0048ms | +69.53% |
| total | 0.29ms | 0.25ms | +0.04ms | +16.21% |

### mcpCallCalc

# Perf Report — mcpCallCalc.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0013ms |
| p50 | 0.0013ms |
| p95 | 0.0018ms |
| p99 | 0.0077ms |
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
| p95 | 0.0018ms | 0.0017ms | +0.00012ms | +7.44% |
| p99 | 0.0077ms | 0.0065ms | +0.0012ms | +18.69% |
| mean | 0.0015ms | 0.0015ms | -0.0000070ms | -0.46% |
| min | 0.0012ms | 0.0013ms | -0.000083ms | -6.42% |
| max | 0.01ms | 0.0090ms | +0.0059ms | +65.74% |
| total | 0.31ms | 0.31ms | -0.0014ms | -0.46% |

### toolRegistryRegister

# Perf Report — toolRegistryRegister.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00029ms |
| p95 | 0.00033ms |
| p99 | 0.0028ms |
| mean | 0.00036ms |
| stdev | 0.00042ms |
| min | 0.00025ms |
| max | 0.0041ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00029ms | -0.000037ms | -12.86% |
| p50 | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| p95 | 0.00033ms | 0.00046ms | -0.00012ms | -27.08% |
| p99 | 0.0028ms | 0.0027ms | +0.00018ms | +6.63% |
| mean | 0.00036ms | 0.00035ms | +0.0000043ms | +1.23% |
| min | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| max | 0.0041ms | 0.0030ms | +0.0011ms | +37.50% |
| total | 0.07ms | 0.07ms | +0.00087ms | +1.23% |

