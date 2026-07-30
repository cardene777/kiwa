# Perf Suite — e2e

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| fetchOverLoopback | 0.22ms | 10.52ms | 20ms | 0.00038ms | PASS | regressed — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| fetchOverLoopback | cpu | 0.09ms | 0.33ms | 0.22ms | 2.413 | 1.832 | 0.20ms | 0.15ms |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| fetchOverLoopback | 4.74ms | 40ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| fetchOverLoopback | 221040 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### fetchOverLoopback

# Perf Report — fetchOverLoopback.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.22ms |
| p50 | 0.60ms |
| p95 | 10.52ms |
| p99 | 17.32ms |
| mean | 2.41ms |
| stdev | 4.37ms |
| min | 0.19ms |
| max | 29.09ms |
| total | 241.18ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.915)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.20ms | 0.15ms | +0.05ms | +31.75% |
| p50 | 0.55ms | 0.18ms | +0.38ms | +214.79% |
| p95 | 9.63ms | 0.50ms | +9.13ms | +1826.19% |
| p99 | 15.86ms | 0.66ms | +15.20ms | +2317.97% |
| mean | 2.21ms | 0.22ms | +1.98ms | +883.15% |
| min | 0.17ms | 0.14ms | +0.03ms | +20.29% |
| max | 26.63ms | 0.71ms | +25.92ms | +3671.52% |
| total | 220.76ms | 22.45ms | +198.30ms | +883.15% |

