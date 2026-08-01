# Perf Suite — solidstart-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00058ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 0.0040ms | 0.0058ms | 100ms | 0.0010ms | PASS | stable — gate 無効 (regressionGate=false) |
| api_route_batch (5 invokeApiRoute) | 0.06ms | 0.11ms | 100ms | 0.0010ms | PASS | stable — gate 無効 (regressionGate=false) |
| fn_error_handling (5 throw + catch) | 0.01ms | 0.02ms | 100ms | 0.00098ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | cpu | 0.09ms | 0.10ms | 0.0040ms | 0.042 | 0.043 | n/a | 20.0% | 0.0035ms | 0.0035ms |
| api_route_batch (5 invokeApiRoute) | cpu | 0.09ms | 0.11ms | 0.06ms | 0.673 | 0.605 | n/a | 20.0% | 0.05ms | 0.05ms |
| fn_error_handling (5 throw + catch) | cpu | 0.10ms | 0.10ms | 0.01ms | 0.139 | 0.139 | n/a | 20.0% | 0.01ms | 0.01ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 0.03ms | 200ms | PASS |
| api_route_batch (5 invokeApiRoute) | 0.28ms | 200ms | PASS |
| fn_error_handling (5 throw + catch) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | -12432 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| api_route_batch (5 invokeApiRoute) | 16608 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| fn_error_handling (5 throw + catch) | 100464 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### server_function_workflow (10 invokeServerFunction)

# Perf Report — server_function_workflow (10 invokeServerFunction).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0040ms |
| p50 | 0.0041ms |
| p95 | 0.0058ms |
| p99 | 0.0088ms |
| mean | 0.0046ms |
| stdev | 0.0013ms |
| min | 0.0039ms |
| max | 0.0096ms |
| total | 0.09ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.884)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0035ms | 0.0035ms | -0.000046ms | -1.29% |
| p50 | 0.0036ms | 0.0036ms | -0.000014ms | -0.38% |
| p95 | 0.0051ms | 0.0056ms | -0.00052ms | -9.26% |
| p99 | 0.0078ms | 0.01ms | -0.0062ms | -44.38% |
| mean | 0.0041ms | 0.0045ms | -0.00042ms | -9.43% |
| min | 0.0035ms | 0.0035ms | -0.000037ms | -1.07% |
| max | 0.0085ms | 0.02ms | -0.0077ms | -47.45% |
| total | 0.08ms | 0.09ms | -0.0084ms | -9.43% |

### api_route_batch (5 invokeApiRoute)

# Perf Report — api_route_batch (5 invokeApiRoute).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.06ms |
| p50 | 0.07ms |
| p95 | 0.11ms |
| p99 | 0.11ms |
| mean | 0.08ms |
| stdev | 0.02ms |
| min | 0.06ms |
| max | 0.12ms |
| total | 1.54ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.857)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | +0.0055ms | +11.29% |
| p50 | 0.06ms | 0.05ms | +0.0036ms | +6.68% |
| p95 | 0.10ms | 0.08ms | +0.01ms | +18.29% |
| p99 | 0.10ms | 0.10ms | -0.0046ms | -4.51% |
| mean | 0.07ms | 0.06ms | +0.0071ms | +12.03% |
| min | 0.05ms | 0.05ms | +0.0066ms | +14.35% |
| max | 0.10ms | 0.11ms | -0.0095ms | -8.79% |
| total | 1.32ms | 1.18ms | +0.14ms | +12.03% |

### fn_error_handling (5 throw + catch)

# Perf Report — fn_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.0030ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.31ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.842)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.000050ms | +0.43% |
| p50 | 0.01ms | 0.01ms | -0.000095ms | -0.79% |
| p95 | 0.02ms | 0.03ms | -0.02ms | -46.48% |
| p99 | 0.02ms | 0.06ms | -0.04ms | -66.53% |
| mean | 0.01ms | 0.02ms | -0.0029ms | -18.42% |
| min | 0.01ms | 0.01ms | +0.00018ms | +1.61% |
| max | 0.02ms | 0.06ms | -0.04ms | -69.31% |
| total | 0.26ms | 0.32ms | -0.06ms | -18.42% |

