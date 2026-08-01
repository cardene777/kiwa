# Perf Suite — qwikcity-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | 0.0078ms | 0.0098ms | 100ms | 0.00047ms | PASS | stable — gate 無効 (regressionGate=false) |
| route_action_form_batch (5 invokeRouteAction with FormData) | 0.0047ms | 0.21ms | 100ms | 0.00046ms | PASS | stable (換算後 p10 +2% (閾値未満)、 p95 +3171% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| loader_error_handling (5 throw + catch) | 0.02ms | 0.03ms | 100ms | 0.00043ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | cpu | 0.09ms | 0.10ms | 0.0078ms | 0.088 | 0.086 | n/a | 20.0% | 0.0073ms | 0.0071ms |
| route_action_form_batch (5 invokeRouteAction with FormData) | cpu | 0.09ms | 0.25ms | 0.0047ms | 0.053 | 0.052 | n/a | 20.0% | 0.0043ms | 0.0042ms |
| loader_error_handling (5 throw + catch) | cpu | 0.09ms | 0.10ms | 0.02ms | 0.251 | 0.248 | n/a | 20.0% | 0.02ms | 0.02ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | 0.05ms | 200ms | PASS |
| route_action_form_batch (5 invokeRouteAction with FormData) | 0.04ms | 200ms | PASS |
| loader_error_handling (5 throw + catch) | 13.55ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | 7000 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| route_action_form_batch (5 invokeRouteAction with FormData) | -7608 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| loader_error_handling (5 throw + catch) | 11560 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### route_loader_workflow (10 invokeRouteLoader)

# Perf Report — route_loader_workflow (10 invokeRouteLoader).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0078ms |
| p50 | 0.0080ms |
| p95 | 0.0098ms |
| p99 | 0.01ms |
| mean | 0.0085ms |
| stdev | 0.00083ms |
| min | 0.0077ms |
| max | 0.01ms |
| total | 0.17ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.934)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0073ms | 0.0071ms | +0.00019ms | +2.62% |
| p50 | 0.0075ms | 0.0073ms | +0.00022ms | +3.04% |
| p95 | 0.0091ms | 0.0081ms | +0.0010ms | +12.35% |
| p99 | 0.0097ms | 0.0084ms | +0.0013ms | +15.67% |
| mean | 0.0079ms | 0.0074ms | +0.00050ms | +6.70% |
| min | 0.0072ms | 0.0070ms | +0.00020ms | +2.83% |
| max | 0.0099ms | 0.0085ms | +0.0014ms | +16.46% |
| total | 0.16ms | 0.15ms | +0.0099ms | +6.70% |

### route_action_form_batch (5 invokeRouteAction with FormData)

# Perf Report — route_action_form_batch (5 invokeRouteAction with FormData).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0047ms |
| p50 | 0.0060ms |
| p95 | 0.21ms |
| p99 | 2.74ms |
| mean | 0.18ms |
| stdev | 0.75ms |
| min | 0.0046ms |
| max | 3.37ms |
| total | 3.57ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.913)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0043ms | 0.0042ms | +0.000096ms | +2.26% |
| p50 | 0.0055ms | 0.0044ms | +0.0011ms | +26.10% |
| p95 | 0.20ms | 0.0060ms | +0.19ms | +3171.13% |
| p99 | 2.50ms | 0.0062ms | +2.49ms | +40257.39% |
| mean | 0.16ms | 0.0047ms | +0.16ms | +3379.74% |
| min | 0.0042ms | 0.0042ms | +0.000057ms | +1.38% |
| max | 3.08ms | 0.0063ms | +3.07ms | +49117.45% |
| total | 3.26ms | 0.09ms | +3.17ms | +3379.74% |

### loader_error_handling (5 throw + catch)

# Perf Report — loader_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0010ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.49ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.864)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00026ms | +1.30% |
| p50 | 0.02ms | 0.02ms | +0.00079ms | +3.87% |
| p95 | 0.02ms | 0.02ms | +0.00018ms | +0.80% |
| p99 | 0.02ms | 0.02ms | +0.00025ms | +1.10% |
| mean | 0.02ms | 0.02ms | +0.00047ms | +2.28% |
| min | 0.02ms | 0.02ms | +0.00019ms | +0.96% |
| max | 0.02ms | 0.02ms | +0.00027ms | +1.17% |
| total | 0.43ms | 0.42ms | +0.0095ms | +2.28% |

