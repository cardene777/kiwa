# Perf Suite — mcp

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| mcpListTools | 0.00058ms | 0.0046ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| mcpCallEcho | 0.00092ms | 0.0042ms | 10ms | 0.00033ms | PASS | stable (換算後 p10 -1% (閾値未満)、 p95 +43% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| mcpCallCalc | 0.0013ms | 0.0038ms | 10ms | 0.00033ms | PASS | stable (換算後 p10 -1% (閾値未満)、 p95 +22% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| toolRegistryRegister | 0.00025ms | 0.0019ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +133%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| mcpListTools | cpu | 0.08ms | 0.09ms | 0.00058ms | 0.007 | 0.007 | 0.00058ms | 0.00058ms |
| mcpCallEcho | cpu | 0.08ms | 0.08ms | 0.00092ms | 0.011 | 0.011 | 0.00091ms | 0.00092ms |
| mcpCallCalc | cpu | 0.08ms | 0.09ms | 0.0013ms | 0.016 | 0.016 | 0.0012ms | 0.0013ms |
| toolRegistryRegister | cpu | 0.08ms | 0.09ms | 0.00025ms | 0.003 | 0.003 | 0.00025ms | 0.00025ms |

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
| mcpListTools | -3720 B | 0 B | 102400 B | yes | PASS |
| mcpCallEcho | 7552 B | 0 B | 102400 B | yes | PASS |
| mcpCallCalc | 1648 B | 0 B | 102400 B | yes | PASS |
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
| p95 | 0.0046ms |
| p99 | 0.01ms |
| mean | 0.0013ms |
| stdev | 0.0022ms |
| min | 0.00054ms |
| max | 0.01ms |
| total | 0.26ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.003)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00058ms | 0.00058ms | +0.0000018ms | +0.31% |
| p50 | 0.00063ms | 0.00063ms | +0.0000019ms | +0.31% |
| p95 | 0.0046ms | 0.0053ms | -0.00069ms | -12.96% |
| p99 | 0.01ms | 0.01ms | +0.00087ms | +7.55% |
| mean | 0.0013ms | 0.0013ms | +0.000024ms | +1.86% |
| min | 0.00054ms | 0.00054ms | +0.0000017ms | +0.31% |
| max | 0.01ms | 0.01ms | +0.00096ms | +7.31% |
| total | 0.26ms | 0.26ms | +0.0048ms | +1.86% |

### mcpCallEcho

# Perf Report — mcpCallEcho.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00092ms |
| p50 | 0.0010ms |
| p95 | 0.0042ms |
| p99 | 0.01ms |
| mean | 0.0016ms |
| stdev | 0.0030ms |
| min | 0.00088ms |
| max | 0.03ms |
| total | 0.32ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.989)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00091ms | 0.00092ms | -0.000010ms | -1.12% |
| p50 | 0.00099ms | 0.00096ms | +0.000030ms | +3.09% |
| p95 | 0.0042ms | 0.0029ms | +0.0013ms | +42.94% |
| p99 | 0.01ms | 0.0093ms | +0.0016ms | +17.11% |
| mean | 0.0016ms | 0.0014ms | +0.00022ms | +15.96% |
| min | 0.00087ms | 0.00088ms | -0.0000099ms | -1.14% |
| max | 0.03ms | 0.02ms | +0.0044ms | +18.13% |
| total | 0.32ms | 0.27ms | +0.04ms | +15.96% |

### mcpCallCalc

# Perf Report — mcpCallCalc.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0013ms |
| p50 | 0.0013ms |
| p95 | 0.0038ms |
| p99 | 0.02ms |
| mean | 0.0025ms |
| stdev | 0.0085ms |
| min | 0.0012ms |
| max | 0.12ms |
| total | 0.51ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.995)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0012ms | 0.0013ms | -0.0000065ms | -0.52% |
| p50 | 0.0013ms | 0.0013ms | -0.0000059ms | -0.45% |
| p95 | 0.0038ms | 0.0031ms | +0.00069ms | +22.00% |
| p99 | 0.02ms | 0.02ms | +0.0060ms | +35.86% |
| mean | 0.0025ms | 0.0019ms | +0.00060ms | +31.14% |
| min | 0.0012ms | 0.0012ms | -0.0000063ms | -0.52% |
| max | 0.12ms | 0.03ms | +0.08ms | +270.04% |
| total | 0.50ms | 0.38ms | +0.12ms | +31.14% |

### toolRegistryRegister

# Perf Report — toolRegistryRegister.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00029ms |
| p95 | 0.0019ms |
| p99 | 0.0078ms |
| mean | 0.00059ms |
| stdev | 0.0014ms |
| min | 0.00025ms |
| max | 0.02ms |
| total | 0.12ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.001)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00025ms | +1.3e-7ms | +0.05% |
| p50 | 0.00029ms | 0.00029ms | +1.5e-7ms | +0.05% |
| p95 | 0.0019ms | 0.0010ms | +0.00085ms | +84.31% |
| p99 | 0.0078ms | 0.0067ms | +0.0011ms | +16.97% |
| mean | 0.00059ms | 0.00055ms | +0.000038ms | +7.02% |
| min | 0.00025ms | 0.00025ms | +1.3e-7ms | +0.05% |
| max | 0.02ms | 0.01ms | +0.0019ms | +14.66% |
| total | 0.12ms | 0.11ms | +0.0077ms | +7.02% |

