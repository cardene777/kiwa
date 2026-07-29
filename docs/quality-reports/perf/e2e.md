# Perf Suite — e2e

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| fetchOverLoopback | 0.15ms | 0.70ms | 20ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| fetchOverLoopback | cpu | 0.08ms | 0.15ms | 1.836 | 1.889 | 0.18ms | 0.18ms |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| fetchOverLoopback | 1.24ms | 40ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| fetchOverLoopback | 218944 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### fetchOverLoopback

# Perf Report — fetchOverLoopback.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.15ms |
| p50 | 0.20ms |
| p95 | 0.70ms |
| p99 | 0.77ms |
| mean | 0.26ms |
| stdev | 0.16ms |
| min | 0.13ms |
| max | 0.87ms |
| total | 25.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.15ms | 0.18ms | -0.03ms | -17.80% |
| p50 | 0.20ms | 0.22ms | -0.02ms | -9.63% |
| p95 | 0.70ms | 0.92ms | -0.22ms | -23.72% |
| p99 | 0.77ms | 1.77ms | -1.00ms | -56.59% |
| mean | 0.26ms | 0.33ms | -0.08ms | -23.54% |
| min | 0.13ms | 0.17ms | -0.04ms | -23.42% |
| max | 0.87ms | 1.80ms | -0.93ms | -51.80% |
| total | 25.57ms | 33.45ms | -7.87ms | -23.54% |

