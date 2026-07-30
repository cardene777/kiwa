# Perf Suite — sveltekit

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeLoad | 0.00067ms | 0.0047ms | 5ms | 0.00031ms | PASS | stable (換算後 p10 -1% (閾値未満)、 p95 +42% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| invokeAction | 0.01ms | 0.06ms | 5ms | 0.00031ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| invokeLoad | cpu | 0.09ms | 0.09ms | 0.00067ms | 0.008 | 0.008 | 0.00062ms | 0.00063ms |
| invokeAction | cpu | 0.09ms | 0.09ms | 0.01ms | 0.133 | 0.135 | 0.01ms | 0.01ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeLoad | 0.02ms | 10ms | PASS |
| invokeAction | 0.30ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeLoad | -1208 B | 0 B | 102400 B | yes | PASS |
| invokeAction | -97016 B | -24776 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeLoad

# Perf Report — invokeLoad.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00067ms |
| p50 | 0.00075ms |
| p95 | 0.0047ms |
| p99 | 0.02ms |
| mean | 0.0018ms |
| stdev | 0.0047ms |
| min | 0.00067ms |
| max | 0.05ms |
| total | 0.36ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.930)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00062ms | 0.00063ms | -0.0000046ms | -0.73% |
| p50 | 0.00070ms | 0.00075ms | -0.000052ms | -6.98% |
| p95 | 0.0044ms | 0.0031ms | +0.0013ms | +42.43% |
| p99 | 0.02ms | 0.0093ms | +0.0078ms | +83.53% |
| mean | 0.0017ms | 0.0012ms | +0.00047ms | +38.70% |
| min | 0.00062ms | 0.00058ms | +0.000037ms | +6.26% |
| max | 0.05ms | 0.02ms | +0.02ms | +116.55% |
| total | 0.33ms | 0.24ms | +0.09ms | +38.70% |

### invokeAction

# Perf Report — invokeAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.06ms |
| p99 | 0.11ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.14ms |
| total | 3.72ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.948)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00018ms | -1.65% |
| p50 | 0.01ms | 0.01ms | -0.00046ms | -3.75% |
| p95 | 0.05ms | 0.05ms | +0.0034ms | +6.82% |
| p99 | 0.11ms | 0.09ms | +0.02ms | +16.95% |
| mean | 0.02ms | 0.02ms | +0.00039ms | +2.25% |
| min | 0.01ms | 0.01ms | -0.00011ms | -1.05% |
| max | 0.13ms | 0.11ms | +0.02ms | +17.88% |
| total | 3.53ms | 3.45ms | +0.08ms | +2.25% |

