# Perf Suite — nuxt-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 0.0088ms | 0.01ms | 100ms | 0.00047ms | PASS | stable (換算後 p10 +1% (閾値未満)、 p95 +30% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| middleware_chain (5 invokeRouteMiddleware) | 0.0031ms | 0.0048ms | 100ms | 0.00047ms | PASS | stable — gate 無効 (regressionGate=false) |
| handler_error_handling (5 throw + catch) | 0.01ms | 0.03ms | 100ms | 0.00048ms | PASS | stable (換算後 p10 -2% (閾値未満)、 p95 +45% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | cpu | 0.09ms | 0.09ms | 0.0088ms | 0.102 | 0.101 | n/a | 20.0% | 0.0083ms | 0.0082ms |
| middleware_chain (5 invokeRouteMiddleware) | cpu | 0.08ms | 0.09ms | 0.0031ms | 0.037 | 0.036 | n/a | 20.0% | 0.0029ms | 0.0029ms |
| handler_error_handling (5 throw + catch) | cpu | 0.08ms | 0.13ms | 0.01ms | 0.178 | 0.181 | n/a | 20.0% | 0.01ms | 0.01ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 0.05ms | 200ms | PASS |
| middleware_chain (5 invokeRouteMiddleware) | 0.02ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.08ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 12640 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| middleware_chain (5 invokeRouteMiddleware) | 10912 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| handler_error_handling (5 throw + catch) | 1440 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### event_handler_workflow (10 invokeEventHandler)

# Perf Report — event_handler_workflow (10 invokeEventHandler).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0088ms |
| p50 | 0.0091ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0032ms |
| min | 0.0086ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.948)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0083ms | 0.0082ms | +0.000092ms | +1.11% |
| p50 | 0.0086ms | 0.0085ms | +0.000069ms | +0.81% |
| p95 | 0.01ms | 0.0099ms | +0.0030ms | +30.06% |
| p99 | 0.02ms | 0.01ms | +0.0096ms | +93.52% |
| mean | 0.0097ms | 0.0087ms | +0.00099ms | +11.32% |
| min | 0.0082ms | 0.0082ms | +0.0000089ms | +0.11% |
| max | 0.02ms | 0.01ms | +0.01ms | +108.59% |
| total | 0.19ms | 0.17ms | +0.02ms | +11.32% |

### middleware_chain (5 invokeRouteMiddleware)

# Perf Report — middleware_chain (5 invokeRouteMiddleware).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0031ms |
| p50 | 0.0039ms |
| p95 | 0.0048ms |
| p99 | 0.0049ms |
| mean | 0.0038ms |
| stdev | 0.00066ms |
| min | 0.0030ms |
| max | 0.0049ms |
| total | 0.08ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.952)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0029ms | 0.0029ms | +0.000061ms | +2.11% |
| p50 | 0.0037ms | 0.0029ms | +0.00079ms | +26.96% |
| p95 | 0.0046ms | 0.01ms | -0.0055ms | -54.77% |
| p99 | 0.0047ms | 0.01ms | -0.0089ms | -65.62% |
| mean | 0.0036ms | 0.0040ms | -0.00033ms | -8.31% |
| min | 0.0029ms | 0.0029ms | +0.000021ms | +0.72% |
| max | 0.0047ms | 0.01ms | -0.0097ms | -67.52% |
| total | 0.07ms | 0.08ms | -0.0066ms | -8.31% |

### handler_error_handling (5 throw + catch)

# Perf Report — handler_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.0062ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.35ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.982)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00025ms | -1.74% |
| p50 | 0.01ms | 0.02ms | -0.00026ms | -1.69% |
| p95 | 0.03ms | 0.02ms | +0.0080ms | +44.55% |
| p99 | 0.04ms | 0.03ms | +0.01ms | +41.83% |
| mean | 0.02ms | 0.02ms | +0.0012ms | +7.48% |
| min | 0.01ms | 0.01ms | -0.000056ms | -0.39% |
| max | 0.04ms | 0.03ms | +0.01ms | +41.38% |
| total | 0.34ms | 0.32ms | +0.02ms | +7.48% |

