# Perf Suite — realtime-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | 0.01ms | 0.04ms | 100ms | 0.00047ms | PASS | stable — gate 無効 (regressionGate=false) |
| presence_workload (trackPresence 10 users + untrack) | 0.01ms | 0.03ms | 100ms | 0.00047ms | PASS | stable (換算後 p10 +12% (閾値未満)、 p95 +77% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| reconnect_resilience (5x connect/disconnect/reconnect) | 0.0034ms | 0.0059ms | 100ms | 0.00048ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | cpu | 0.09ms | 0.10ms | 0.01ms | 0.162 | 0.164 | n/a | 20.0% | 0.01ms | 0.01ms |
| presence_workload (trackPresence 10 users + untrack) | cpu | 0.09ms | 0.11ms | 0.01ms | 0.123 | 0.110 | n/a | 20.0% | 0.01ms | 0.0090ms |
| reconnect_resilience (5x connect/disconnect/reconnect) | cpu | 0.09ms | 0.09ms | 0.0034ms | 0.039 | 0.038 | n/a | 20.0% | 0.0032ms | 0.0032ms |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | 0.09ms | 200ms | PASS |
| presence_workload (trackPresence 10 users + untrack) | 0.04ms | 200ms | PASS |
| reconnect_resilience (5x connect/disconnect/reconnect) | 0.02ms | 200ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | -31808 B | 0 B | 102400 B | yes | 18 (3 + 15) | PASS |
| presence_workload (trackPresence 10 users + untrack) | 648 B | 0 B | 102400 B | yes | 18 (3 + 15) | PASS |
| reconnect_resilience (5x connect/disconnect/reconnect) | 1536 B | 0 B | 102400 B | yes | 18 (3 + 15) | PASS |

## Detailed serial reports

### chat_room_broadcast (subscribe + 20 publish)

# Perf Report — chat_room_broadcast (subscribe + 20 publish).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.0076ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.31ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.937)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00012ms | -0.89% |
| p50 | 0.02ms | 0.02ms | +0.0012ms | +7.13% |
| p95 | 0.03ms | 0.03ms | +0.0045ms | +15.41% |
| p99 | 0.04ms | 0.04ms | +0.00091ms | +2.60% |
| mean | 0.02ms | 0.02ms | +0.00023ms | +1.19% |
| min | 0.01ms | 0.01ms | +0.00040ms | +3.14% |
| max | 0.04ms | 0.04ms | +0.000010ms | +0.03% |
| total | 0.29ms | 0.29ms | +0.0034ms | +1.19% |

### presence_workload (trackPresence 10 users + untrack)

# Perf Report — presence_workload (trackPresence 10 users + untrack).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0069ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.22ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.945)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0090ms | +0.0011ms | +11.62% |
| p50 | 0.01ms | 0.0098ms | +0.00092ms | +9.36% |
| p95 | 0.03ms | 0.01ms | +0.01ms | +76.76% |
| p99 | 0.03ms | 0.02ms | +0.02ms | +112.65% |
| mean | 0.01ms | 0.01ms | +0.0029ms | +26.43% |
| min | 0.010ms | 0.0090ms | +0.00096ms | +10.66% |
| max | 0.03ms | 0.02ms | +0.02ms | +121.40% |
| total | 0.21ms | 0.16ms | +0.04ms | +26.43% |

### reconnect_resilience (5x connect/disconnect/reconnect)

# Perf Report — reconnect_resilience (5x connect/disconnect/reconnect).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.0034ms |
| p50 | 0.0035ms |
| p95 | 0.0059ms |
| p99 | 0.0081ms |
| mean | 0.0039ms |
| stdev | 0.0014ms |
| min | 0.0033ms |
| max | 0.0087ms |
| total | 0.06ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.959)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0032ms | 0.0032ms | +0.000069ms | +2.18% |
| p50 | 0.0033ms | 0.0033ms | -0.000017ms | -0.51% |
| p95 | 0.0056ms | 0.0060ms | -0.00036ms | -6.07% |
| p99 | 0.0078ms | 0.0083ms | -0.00053ms | -6.34% |
| mean | 0.0037ms | 0.0039ms | -0.00011ms | -2.82% |
| min | 0.0032ms | 0.0030ms | +0.00015ms | +5.07% |
| max | 0.0083ms | 0.0089ms | -0.00057ms | -6.38% |
| total | 0.06ms | 0.06ms | -0.0016ms | -2.82% |

