# Perf Suite — fresh

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeFreshHandler | 0.0088ms | 0.03ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| mountIsland | 0.0013ms | 0.0034ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| invokeFreshHandler | cpu | 0.08ms | 0.09ms | 0.0088ms | 0.106 | 0.096 | 0.0088ms | 0.0080ms |
| mountIsland | cpu | 0.08ms | 0.08ms | 0.0013ms | 0.016 | 0.016 | 0.0013ms | 0.0013ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeFreshHandler | 0.44ms | 10ms | PASS |
| mountIsland | 0.03ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeFreshHandler | -106768 B | -250 B | 102400 B | yes | PASS |
| mountIsland | 1128 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeFreshHandler

# Perf Report — invokeFreshHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0088ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.07ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0083ms |
| max | 0.11ms |
| total | 2.77ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.995)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0088ms | 0.0080ms | +0.00083ms | +10.46% |
| p50 | 0.01ms | 0.01ms | +0.00020ms | +1.97% |
| p95 | 0.03ms | 0.05ms | -0.01ms | -31.65% |
| p99 | 0.07ms | 0.13ms | -0.06ms | -45.83% |
| mean | 0.01ms | 0.02ms | -0.0069ms | -33.31% |
| min | 0.0083ms | 0.0076ms | +0.00071ms | +9.34% |
| max | 0.11ms | 1.01ms | -0.89ms | -88.81% |
| total | 2.76ms | 4.13ms | -1.38ms | -33.31% |

### mountIsland

# Perf Report — mountIsland.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0013ms |
| p50 | 0.0014ms |
| p95 | 0.0034ms |
| p99 | 0.02ms |
| mean | 0.0020ms |
| stdev | 0.0034ms |
| min | 0.0013ms |
| max | 0.03ms |
| total | 0.39ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.006)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0013ms | 0.0013ms | +0.0000083ms | +0.64% |
| p50 | 0.0014ms | 0.0013ms | +0.000049ms | +3.69% |
| p95 | 0.0035ms | 0.0049ms | -0.0015ms | -29.64% |
| p99 | 0.02ms | 0.03ms | -0.0089ms | -34.78% |
| mean | 0.0020ms | 0.0026ms | -0.00059ms | -23.01% |
| min | 0.0013ms | 0.0012ms | +0.000048ms | +3.98% |
| max | 0.03ms | 0.10ms | -0.06ms | -64.39% |
| total | 0.39ms | 0.51ms | -0.12ms | -23.01% |

