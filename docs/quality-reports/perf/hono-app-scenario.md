# Perf Suite — hono-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00058ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | 0.02ms | 0.03ms | 100ms | 0.0010ms | PASS | stable — gate 無効 (regressionGate=false) |
| rpc_client_batch (5 rpc calls) | 0.01ms | 0.02ms | 100ms | 0.0010ms | PASS | stable — gate 無効 (regressionGate=false) |
| route_error_handling (5 throw + catch) | 0.04ms | 0.04ms | 100ms | 0.0010ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | cpu | 0.09ms | 0.10ms | 0.02ms | 0.257 | 0.262 | n/a | 20.0% | 0.02ms | 0.02ms |
| rpc_client_batch (5 rpc calls) | cpu | 0.09ms | 0.09ms | 0.01ms | 0.151 | 0.154 | n/a | 20.0% | 0.01ms | 0.01ms |
| route_error_handling (5 throw + catch) | cpu | 0.09ms | 0.09ms | 0.04ms | 0.417 | 0.414 | n/a | 20.0% | 0.03ms | 0.03ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | 0.12ms | 200ms | PASS |
| rpc_client_batch (5 rpc calls) | 0.08ms | 200ms | PASS |
| route_error_handling (5 throw + catch) | 0.18ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | 24008 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| rpc_client_batch (5 rpc calls) | -400 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| route_error_handling (5 throw + catch) | -224 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### route_workflow (10 invokeRoute GET+POST mix)

# Perf Report — route_workflow (10 invokeRoute GET+POST mix).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0038ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.53ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.894)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00044ms | -2.01% |
| p50 | 0.02ms | 0.02ms | +0.00023ms | +1.03% |
| p95 | 0.03ms | 0.03ms | +0.0011ms | +3.84% |
| p99 | 0.03ms | 0.03ms | +0.0024ms | +8.04% |
| mean | 0.02ms | 0.02ms | +0.00013ms | +0.54% |
| min | 0.02ms | 0.02ms | -0.00037ms | -1.72% |
| max | 0.03ms | 0.03ms | +0.0027ms | +9.08% |
| total | 0.47ms | 0.47ms | +0.0026ms | +0.54% |

### rpc_client_batch (5 rpc calls)

# Perf Report — rpc_client_batch (5 rpc calls).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.0016ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.31ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.877)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00021ms | -1.66% |
| p50 | 0.01ms | 0.01ms | +0.000023ms | +0.18% |
| p95 | 0.02ms | 0.01ms | +0.0019ms | +13.67% |
| p99 | 0.02ms | 0.01ms | +0.0017ms | +11.54% |
| mean | 0.01ms | 0.01ms | +0.00058ms | +4.43% |
| min | 0.01ms | 0.01ms | +0.000060ms | +0.49% |
| max | 0.02ms | 0.01ms | +0.0016ms | +11.03% |
| total | 0.27ms | 0.26ms | +0.01ms | +4.43% |

### route_error_handling (5 throw + catch)

# Perf Report — route_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.04ms |
| stdev | 0.00085ms |
| min | 0.04ms |
| max | 0.04ms |
| total | 0.80ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.864)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.00030ms | +0.88% |
| p50 | 0.03ms | 0.03ms | -0.00013ms | -0.38% |
| p95 | 0.04ms | 0.04ms | +0.000018ms | +0.05% |
| p99 | 0.04ms | 0.04ms | +0.00037ms | +1.04% |
| mean | 0.03ms | 0.03ms | -0.000018ms | -0.05% |
| min | 0.03ms | 0.03ms | +0.00036ms | +1.09% |
| max | 0.04ms | 0.04ms | +0.00046ms | +1.29% |
| total | 0.69ms | 0.69ms | -0.00035ms | -0.05% |

