# Perf Suite — mcp

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| mcpListTools | 0.00058ms | 0.0040ms | 10ms | 0.00034ms | PASS | stable (p10 +2% (閾値未満)、 p95 +29% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| mcpCallEcho | 0.00092ms | 0.0018ms | 10ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| mcpCallCalc | 0.0013ms | 0.0032ms | 10ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| toolRegistryRegister | 0.00025ms | 0.00034ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +134%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| mcpListTools | cpu | 0.08ms | 0.00058ms | 0.007 | 0.007 | 0.00059ms | 0.00058ms |
| mcpCallEcho | cpu | 0.08ms | 0.00092ms | 0.011 | 0.012 | 0.00094ms | 0.00096ms |
| mcpCallCalc | cpu | 0.08ms | 0.0013ms | 0.016 | 0.015 | 0.0013ms | 0.0013ms |
| toolRegistryRegister | cpu | 0.08ms | 0.00025ms | 0.003 | 0.003 | 0.00025ms | 0.00025ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| mcpListTools | 0.01ms | 20ms | PASS |
| mcpCallEcho | 0.02ms | 20ms | PASS |
| mcpCallCalc | 0.03ms | 20ms | PASS |
| toolRegistryRegister | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| mcpListTools | -12840 B | 0 B | 102400 B | yes | PASS |
| mcpCallEcho | -488 B | 0 B | 102400 B | yes | PASS |
| mcpCallCalc | 520 B | 0 B | 102400 B | yes | PASS |
| toolRegistryRegister | 648 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### mcpListTools

# Perf Report — mcpListTools.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.00063ms |
| p95 | 0.0040ms |
| p99 | 0.01ms |
| mean | 0.0011ms |
| stdev | 0.0018ms |
| min | 0.00054ms |
| max | 0.01ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00058ms | 0.00058ms | 0.00ms | 0.00% |
| p50 | 0.00063ms | 0.00063ms | 0.00ms | 0.00% |
| p95 | 0.0040ms | 0.0031ms | +0.00085ms | +27.05% |
| p99 | 0.01ms | 0.01ms | -0.0039ms | -27.02% |
| mean | 0.0011ms | 0.0014ms | -0.00022ms | -16.22% |
| min | 0.00054ms | 0.00054ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.02ms | -0.01ms | -42.59% |
| total | 0.23ms | 0.27ms | -0.04ms | -16.22% |

### mcpCallEcho

# Perf Report — mcpCallEcho.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00092ms |
| p50 | 0.00096ms |
| p95 | 0.0018ms |
| p99 | 0.0064ms |
| mean | 0.0012ms |
| stdev | 0.00094ms |
| min | 0.00088ms |
| max | 0.0097ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00092ms | 0.00096ms | -0.000042ms | -4.38% |
| p50 | 0.00096ms | 0.00096ms | -0.0000010ms | -0.10% |
| p95 | 0.0018ms | 0.0023ms | -0.00045ms | -19.69% |
| p99 | 0.0064ms | 0.0070ms | -0.00062ms | -8.86% |
| mean | 0.0012ms | 0.0013ms | -0.00011ms | -8.69% |
| min | 0.00088ms | 0.00092ms | -0.000041ms | -4.48% |
| max | 0.0097ms | 0.02ms | -0.0094ms | -49.02% |
| total | 0.23ms | 0.25ms | -0.02ms | -8.69% |

### mcpCallCalc

# Perf Report — mcpCallCalc.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0013ms |
| p50 | 0.0013ms |
| p95 | 0.0032ms |
| p99 | 0.01ms |
| mean | 0.0019ms |
| stdev | 0.0032ms |
| min | 0.0013ms |
| max | 0.03ms |
| total | 0.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0013ms | 0.0013ms | +0.000041ms | +3.28% |
| p50 | 0.0013ms | 0.0013ms | -0.0000010ms | -0.07% |
| p95 | 0.0032ms | 0.0033ms | -0.00011ms | -3.35% |
| p99 | 0.01ms | 0.02ms | -0.0079ms | -41.46% |
| mean | 0.0019ms | 0.0019ms | -0.0000077ms | -0.41% |
| min | 0.0013ms | 0.0012ms | +0.000042ms | +3.48% |
| max | 0.03ms | 0.02ms | +0.01ms | +56.04% |
| total | 0.37ms | 0.37ms | -0.0015ms | -0.41% |

### toolRegistryRegister

# Perf Report — toolRegistryRegister.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00029ms |
| p95 | 0.00034ms |
| p99 | 0.0036ms |
| mean | 0.00037ms |
| stdev | 0.00050ms |
| min | 0.00025ms |
| max | 0.0045ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| p50 | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| p95 | 0.00034ms | 0.00081ms | -0.00047ms | -58.25% |
| p99 | 0.0036ms | 0.0043ms | -0.00069ms | -15.96% |
| mean | 0.00037ms | 0.00048ms | -0.00011ms | -23.70% |
| min | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| max | 0.0045ms | 0.01ms | -0.0073ms | -61.70% |
| total | 0.07ms | 0.10ms | -0.02ms | -23.70% |

