# Perf Suite — cli-test

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| writeFile | 0.13ms | 0.73ms | 20ms | 0.00036ms | PASS | stable (換算後 p10 +4% (閾値未満)、 p95 +188% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| readFile | 0.05ms | 0.28ms | 10ms | 0.00035ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| writeFile | fs-write | 0.09ms | 0.58ms | 0.13ms | 1.542 | 1.489 | n/a | 20.0% | 0.11ms | 0.11ms |
| readFile | fs-read | 0.05ms | 0.31ms | 0.05ms | 1.019 | 1.006 | n/a | 20.0% | 0.04ms | 0.04ms |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| writeFile | 0.85ms | 40ms | PASS |
| readFile | 0.26ms | 20ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| writeFile | 3472 B | 0 B | 102400 B | yes | 110 (10 + 100) | PASS |
| readFile | 7936 B | 0 B | 102400 B | yes | 110 (10 + 100) | PASS |

## Detailed serial reports

### writeFile

# Perf Report — writeFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.13ms |
| p50 | 0.24ms |
| p95 | 0.73ms |
| p99 | 1.70ms |
| mean | 0.35ms |
| stdev | 0.30ms |
| min | 0.12ms |
| max | 2.01ms |
| total | 34.94ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.854)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.11ms | 0.11ms | +0.0038ms | +3.52% |
| p50 | 0.20ms | 0.13ms | +0.07ms | +51.97% |
| p95 | 0.62ms | 0.22ms | +0.41ms | +188.20% |
| p99 | 1.45ms | 0.25ms | +1.20ms | +479.03% |
| mean | 0.30ms | 0.14ms | +0.16ms | +108.34% |
| min | 0.10ms | 0.10ms | -0.00039ms | -0.39% |
| max | 1.72ms | 0.32ms | +1.40ms | +439.93% |
| total | 29.83ms | 14.32ms | +15.51ms | +108.34% |

### readFile

# Perf Report — readFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.06ms |
| p95 | 0.28ms |
| p99 | 1.12ms |
| mean | 0.12ms |
| stdev | 0.20ms |
| min | 0.05ms |
| max | 1.54ms |
| total | 12.07ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.849)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | +0.00056ms | +1.36% |
| p50 | 0.05ms | 0.06ms | -0.0048ms | -8.11% |
| p95 | 0.24ms | 0.28ms | -0.04ms | -14.89% |
| p99 | 0.95ms | 0.78ms | +0.17ms | +21.57% |
| mean | 0.10ms | 0.12ms | -0.02ms | -12.91% |
| min | 0.04ms | 0.04ms | +0.0013ms | +3.49% |
| max | 1.31ms | 1.70ms | -0.39ms | -22.99% |
| total | 10.24ms | 11.76ms | -1.52ms | -12.91% |

