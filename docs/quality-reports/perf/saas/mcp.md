# Perf Suite — mcp

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| mcpListTools | 0.00063ms | 0.0022ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| mcpCallEcho | 0.00092ms | 0.0017ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| mcpCallCalc | 0.0013ms | 0.0023ms | 10ms | 0.00033ms | PASS | stable (p10 -3% (閾値未満)、 p95 +40% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| toolRegistryRegister | 0.00025ms | 0.00033ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +116%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| mcpListTools | 0.03ms | 20ms | PASS |
| mcpCallEcho | 0.02ms | 20ms | PASS |
| mcpCallCalc | 0.02ms | 20ms | PASS |
| toolRegistryRegister | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| mcpListTools | 226712 B | 0 B | 102400 B | yes | PASS |
| mcpCallEcho | -520 B | 0 B | 102400 B | yes | PASS |
| mcpCallCalc | 616 B | 0 B | 102400 B | yes | PASS |
| toolRegistryRegister | 6296 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### mcpListTools

# Perf Report — mcpListTools.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00063ms |
| p50 | 0.00067ms |
| p95 | 0.0022ms |
| p99 | 0.0058ms |
| mean | 0.00090ms |
| stdev | 0.00097ms |
| min | 0.00058ms |
| max | 0.0096ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00063ms | 0.00063ms | 0.00ms | 0.00% |
| p50 | 0.00067ms | 0.00071ms | -0.000042ms | -5.92% |
| p95 | 0.0022ms | 0.0026ms | -0.00044ms | -16.95% |
| p99 | 0.0058ms | 0.0065ms | -0.00072ms | -11.00% |
| mean | 0.00090ms | 0.0011ms | -0.00021ms | -18.73% |
| min | 0.00058ms | 0.00063ms | -0.000042ms | -6.72% |
| max | 0.0096ms | 0.0085ms | +0.0011ms | +12.69% |
| total | 0.18ms | 0.22ms | -0.04ms | -18.73% |

### mcpCallEcho

# Perf Report — mcpCallEcho.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00092ms |
| p50 | 0.00096ms |
| p95 | 0.0017ms |
| p99 | 0.0051ms |
| mean | 0.0012ms |
| stdev | 0.0010ms |
| min | 0.00092ms |
| max | 0.01ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00092ms | 0.00096ms | -0.000041ms | -4.28% |
| p50 | 0.00096ms | 0.0010ms | -0.000083ms | -7.97% |
| p95 | 0.0017ms | 0.0017ms | +0.000051ms | +3.06% |
| p99 | 0.0051ms | 0.0047ms | +0.00038ms | +8.23% |
| mean | 0.0012ms | 0.0013ms | -0.000059ms | -4.67% |
| min | 0.00092ms | 0.00092ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.0068ms | +0.0048ms | +70.74% |
| total | 0.24ms | 0.25ms | -0.01ms | -4.67% |

### mcpCallCalc

# Perf Report — mcpCallCalc.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0013ms |
| p50 | 0.0013ms |
| p95 | 0.0023ms |
| p99 | 0.0093ms |
| mean | 0.0016ms |
| stdev | 0.0013ms |
| min | 0.0012ms |
| max | 0.01ms |
| total | 0.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0013ms | 0.0013ms | -0.000042ms | -3.15% |
| p50 | 0.0013ms | 0.0014ms | -0.000042ms | -3.05% |
| p95 | 0.0023ms | 0.0017ms | +0.00067ms | +40.38% |
| p99 | 0.0093ms | 0.0065ms | +0.0028ms | +42.91% |
| mean | 0.0016ms | 0.0015ms | +0.000065ms | +4.25% |
| min | 0.0012ms | 0.0013ms | -0.000084ms | -6.50% |
| max | 0.01ms | 0.0090ms | +0.0034ms | +37.96% |
| total | 0.32ms | 0.31ms | +0.01ms | +4.25% |

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
| mean | 0.00035ms |
| stdev | 0.00041ms |
| min | 0.00021ms |
| max | 0.0043ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00029ms | -0.000037ms | -12.86% |
| p50 | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| p95 | 0.00033ms | 0.00046ms | -0.00012ms | -27.08% |
| p99 | 0.0028ms | 0.0027ms | +0.00013ms | +4.89% |
| mean | 0.00035ms | 0.00035ms | +0.0000033ms | +0.94% |
| min | 0.00021ms | 0.00025ms | -0.000042ms | -16.80% |
| max | 0.0043ms | 0.0030ms | +0.0013ms | +41.67% |
| total | 0.07ms | 0.07ms | +0.00066ms | +0.94% |

