# Perf Suite — mcp

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00046ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00092ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| mcpListTools | 0.00075ms | 0.0027ms | 10ms | 0.00092ms | PASS | stable (差 0.00013ms が下限 0.00092ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| mcpCallEcho | 0.00096ms | 0.0021ms | 10ms | 0.00092ms | PASS | stable (p10 0% (閾値未満)、 p95 +27% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| mcpCallCalc | 0.0015ms | 0.0020ms | 10ms | 0.00092ms | PASS | stable (p10 +16% (閾値未満)、 p95 +23% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| toolRegistryRegister | 0.00025ms | 0.00038ms | 5ms | 0.00092ms | PASS | stable (検知には +0.00092ms (baseline 比 +319%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| mcpListTools | 0.06ms | 20ms | PASS |
| mcpCallEcho | 0.02ms | 20ms | PASS |
| mcpCallCalc | 0.09ms | 20ms | PASS |
| toolRegistryRegister | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| mcpListTools | -15328 B | 0 B | 102400 B | yes | PASS |
| mcpCallEcho | 28144 B | 0 B | 102400 B | yes | PASS |
| mcpCallCalc | 440 B | 0 B | 102400 B | yes | PASS |
| toolRegistryRegister | 416 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### mcpListTools

# Perf Report — mcpListTools.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00075ms |
| p50 | 0.00079ms |
| p95 | 0.0027ms |
| p99 | 0.0093ms |
| mean | 0.0013ms |
| stdev | 0.0015ms |
| min | 0.00063ms |
| max | 0.01ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00075ms | 0.00063ms | +0.00013ms | +20.00% |
| p50 | 0.00079ms | 0.00071ms | +0.000083ms | +11.71% |
| p95 | 0.0027ms | 0.0026ms | +0.000061ms | +2.34% |
| p99 | 0.0093ms | 0.0065ms | +0.0027ms | +41.94% |
| mean | 0.0013ms | 0.0011ms | +0.00018ms | +16.48% |
| min | 0.00063ms | 0.00063ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.0085ms | +0.0037ms | +43.43% |
| total | 0.26ms | 0.22ms | +0.04ms | +16.48% |

### mcpCallEcho

# Perf Report — mcpCallEcho.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00096ms |
| p50 | 0.0013ms |
| p95 | 0.0021ms |
| p99 | 0.0068ms |
| mean | 0.0014ms |
| stdev | 0.0011ms |
| min | 0.00092ms |
| max | 0.01ms |
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00096ms | 0.00096ms | 0.00ms | 0.00% |
| p50 | 0.0013ms | 0.0010ms | +0.00021ms | +19.96% |
| p95 | 0.0021ms | 0.0017ms | +0.00045ms | +26.71% |
| p99 | 0.0068ms | 0.0047ms | +0.0022ms | +46.20% |
| mean | 0.0014ms | 0.0013ms | +0.000094ms | +7.43% |
| min | 0.00092ms | 0.00092ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.0068ms | +0.0039ms | +56.72% |
| total | 0.27ms | 0.25ms | +0.02ms | +7.43% |

### mcpCallCalc

# Perf Report — mcpCallCalc.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0015ms |
| p50 | 0.0016ms |
| p95 | 0.0020ms |
| p99 | 0.0065ms |
| mean | 0.0018ms |
| stdev | 0.0012ms |
| min | 0.0015ms |
| max | 0.01ms |
| total | 0.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0015ms | 0.0013ms | +0.00021ms | +15.68% |
| p50 | 0.0016ms | 0.0014ms | +0.00025ms | +18.18% |
| p95 | 0.0020ms | 0.0017ms | +0.00038ms | +22.62% |
| p99 | 0.0065ms | 0.0065ms | +0.000024ms | +0.37% |
| mean | 0.0018ms | 0.0015ms | +0.00027ms | +17.64% |
| min | 0.0015ms | 0.0013ms | +0.00021ms | +16.10% |
| max | 0.01ms | 0.0090ms | +0.0059ms | +65.74% |
| total | 0.36ms | 0.31ms | +0.05ms | +17.64% |

### toolRegistryRegister

# Perf Report — toolRegistryRegister.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00029ms |
| p95 | 0.00038ms |
| p99 | 0.0027ms |
| mean | 0.00036ms |
| stdev | 0.00041ms |
| min | 0.00025ms |
| max | 0.0040ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00029ms | -0.000037ms | -12.86% |
| p50 | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| p95 | 0.00038ms | 0.00046ms | -0.000083ms | -18.13% |
| p99 | 0.0027ms | 0.0027ms | +0.0000096ms | +0.36% |
| mean | 0.00036ms | 0.00035ms | +0.0000083ms | +2.37% |
| min | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| max | 0.0040ms | 0.0030ms | +0.00096ms | +31.93% |
| total | 0.07ms | 0.07ms | +0.0017ms | +2.37% |

