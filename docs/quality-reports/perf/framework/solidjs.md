# Perf Suite — solidjs

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| renderSolid | 0.00063ms | 0.0017ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| mockSignalEffect | 0.00088ms | 0.0033ms | 5ms | 0.00033ms | PASS | stable (p10 -9% (閾値未満)、 p95 +86% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| renderSolid | 0.02ms | 10ms | PASS |
| mockSignalEffect | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| renderSolid | -26728 B | 0 B | 102400 B | yes | PASS |
| mockSignalEffect | -456 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### renderSolid

# Perf Report — renderSolid.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00063ms |
| p50 | 0.00067ms |
| p95 | 0.0017ms |
| p99 | 0.0065ms |
| mean | 0.00098ms |
| stdev | 0.0012ms |
| min | 0.00058ms |
| max | 0.01ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00063ms | 0.00063ms | 0.00ms | 0.00% |
| p50 | 0.00067ms | 0.00067ms | 0.00ms | 0.00% |
| p95 | 0.0017ms | 0.0015ms | +0.00013ms | +8.50% |
| p99 | 0.0065ms | 0.0048ms | +0.0017ms | +34.40% |
| mean | 0.00098ms | 0.00083ms | +0.00014ms | +17.01% |
| min | 0.00058ms | 0.00058ms | +0.0000010ms | +0.17% |
| max | 0.01ms | 0.0066ms | +0.0061ms | +93.01% |
| total | 0.20ms | 0.17ms | +0.03ms | +17.01% |

### mockSignalEffect

# Perf Report — mockSignalEffect.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00088ms |
| p50 | 0.00092ms |
| p95 | 0.0033ms |
| p99 | 0.0055ms |
| mean | 0.0013ms |
| stdev | 0.0011ms |
| min | 0.00083ms |
| max | 0.0093ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00088ms | 0.00096ms | -0.000083ms | -8.66% |
| p50 | 0.00092ms | 0.0010ms | -0.000084ms | -8.40% |
| p95 | 0.0033ms | 0.0018ms | +0.0015ms | +86.16% |
| p99 | 0.0055ms | 0.0057ms | -0.00019ms | -3.25% |
| mean | 0.0013ms | 0.0013ms | -0.0000017ms | -0.13% |
| min | 0.00083ms | 0.00092ms | -0.000083ms | -9.06% |
| max | 0.0093ms | 0.01ms | -0.0032ms | -25.67% |
| total | 0.25ms | 0.26ms | -0.00034ms | -0.13% |

