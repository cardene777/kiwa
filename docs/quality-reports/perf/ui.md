# Perf Suite — ui

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| setupComponentEnvSnapshot | 0.18ms | 0.53ms | 30ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| setupComponentEnvRender | 0.14ms | 0.37ms | 30ms | 0.00033ms | PASS | stable (換算後 p10 +5% (閾値未満)、 p95 +22% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| setupComponentEnvSnapshot | cpu | 0.08ms | 0.09ms | 0.18ms | 2.212 | 2.322 | 0.18ms | 0.19ms |
| setupComponentEnvRender | cpu | 0.08ms | 0.09ms | 0.14ms | 1.739 | 1.649 | 0.14ms | 0.13ms |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| setupComponentEnvSnapshot | 3.07ms | 60ms | PASS |
| setupComponentEnvRender | 0.92ms | 60ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| setupComponentEnvSnapshot | 58496 B | 0 B | 102400 B | yes | PASS |
| setupComponentEnvRender | 12184 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### setupComponentEnvSnapshot

# Perf Report — setupComponentEnvSnapshot.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.18ms |
| p50 | 0.22ms |
| p95 | 0.53ms |
| p99 | 0.60ms |
| mean | 0.27ms |
| stdev | 0.12ms |
| min | 0.16ms |
| max | 0.67ms |
| total | 13.53ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.015)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.18ms | 0.19ms | -0.0090ms | -4.73% |
| p50 | 0.23ms | 0.22ms | +0.0085ms | +3.88% |
| p95 | 0.53ms | 0.47ms | +0.06ms | +13.21% |
| p99 | 0.61ms | 0.55ms | +0.07ms | +12.15% |
| mean | 0.27ms | 0.25ms | +0.02ms | +9.20% |
| min | 0.16ms | 0.17ms | -0.0094ms | -5.40% |
| max | 0.68ms | 0.55ms | +0.13ms | +23.01% |
| total | 13.73ms | 12.58ms | +1.16ms | +9.20% |

### setupComponentEnvRender

# Perf Report — setupComponentEnvRender.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.14ms |
| p50 | 0.18ms |
| p95 | 0.37ms |
| p99 | 0.64ms |
| mean | 0.20ms |
| stdev | 0.11ms |
| min | 0.14ms |
| max | 0.88ms |
| total | 9.93ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.003)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.14ms | 0.13ms | +0.0072ms | +5.44% |
| p50 | 0.18ms | 0.16ms | +0.02ms | +12.72% |
| p95 | 0.37ms | 0.30ms | +0.07ms | +21.98% |
| p99 | 0.64ms | 0.37ms | +0.28ms | +75.97% |
| mean | 0.20ms | 0.18ms | +0.02ms | +10.63% |
| min | 0.14ms | 0.13ms | +0.01ms | +8.91% |
| max | 0.88ms | 0.39ms | +0.49ms | +123.14% |
| total | 9.96ms | 9.00ms | +0.96ms | +10.63% |

