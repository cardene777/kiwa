# Perf Suite — cli

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| runSpecToTest | 0.12ms | 0.56ms | 20ms | 0.00022ms | PASS | improved — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| runSpecToTest | fs-write | 0.13ms | 4.92ms | 0.12ms | 0.944 | 1.305 | n/a | 20.0% | 0.06ms | 0.09ms |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| runSpecToTest | 2.07ms | 40ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| runSpecToTest | 11064 B | 0 B | 102400 B | yes | 110 (10 + 100) | PASS |

## Detailed serial reports

### runSpecToTest

# Perf Report — runSpecToTest.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.12ms |
| p50 | 0.17ms |
| p95 | 0.56ms |
| p99 | 4.06ms |
| mean | 0.33ms |
| stdev | 0.67ms |
| min | 0.11ms |
| max | 5.48ms |
| total | 32.98ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.532)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.06ms | 0.09ms | -0.02ms | -27.66% |
| p50 | 0.09ms | 0.11ms | -0.02ms | -17.53% |
| p95 | 0.30ms | 0.16ms | +0.13ms | +80.31% |
| p99 | 2.16ms | 0.20ms | +1.96ms | +964.02% |
| mean | 0.18ms | 0.12ms | +0.06ms | +51.77% |
| min | 0.06ms | 0.08ms | -0.02ms | -27.66% |
| max | 2.92ms | 0.33ms | +2.59ms | +783.78% |
| total | 17.55ms | 11.57ms | +5.99ms | +51.77% |

