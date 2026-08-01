# Perf Suite — remix-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| loader_workflow (10 invokeLoader) | 0.04ms | 0.06ms | 100ms | 0.00044ms | PASS | stable — gate 無効 (regressionGate=false) |
| action_batch (5 invokeAction) | 0.01ms | 0.02ms | 100ms | 0.00044ms | PASS | improved — gate 無効 (regressionGate=false) |
| loader_error_handling (5 throw + catch) | 0.03ms | 0.04ms | 100ms | 0.00044ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| loader_workflow (10 invokeLoader) | cpu | 0.09ms | 0.10ms | 0.04ms | 0.383 | 0.381 | n/a | 20.0% | 0.03ms | 0.03ms |
| action_batch (5 invokeAction) | cpu | 0.09ms | 0.09ms | 0.01ms | 0.123 | 0.169 | n/a | 20.0% | 0.01ms | 0.01ms |
| loader_error_handling (5 throw + catch) | cpu | 0.09ms | 0.09ms | 0.03ms | 0.320 | 0.320 | n/a | 20.0% | 0.03ms | 0.03ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| loader_workflow (10 invokeLoader) | 0.15ms | 200ms | PASS |
| action_batch (5 invokeAction) | 0.08ms | 200ms | PASS |
| loader_error_handling (5 throw + catch) | 0.13ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| loader_workflow (10 invokeLoader) | 3168 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| action_batch (5 invokeAction) | 952 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| loader_error_handling (5 throw + catch) | -1880 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### loader_workflow (10 invokeLoader)

# Perf Report — loader_workflow (10 invokeLoader).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.06ms |
| p99 | 0.07ms |
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.08ms |
| total | 0.89ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.879)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.00021ms | +0.69% |
| p50 | 0.04ms | 0.04ms | +0.00018ms | +0.48% |
| p95 | 0.06ms | 0.06ms | -0.0061ms | -9.74% |
| p99 | 0.07ms | 0.09ms | -0.03ms | -28.12% |
| mean | 0.04ms | 0.04ms | -0.0013ms | -3.21% |
| min | 0.03ms | 0.03ms | -0.000078ms | -0.27% |
| max | 0.07ms | 0.10ms | -0.03ms | -31.09% |
| total | 0.78ms | 0.80ms | -0.03ms | -3.21% |

### action_batch (5 invokeAction)

# Perf Report — action_batch (5 invokeAction).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0018ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.25ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.880)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.0038ms | -27.43% |
| p50 | 0.01ms | 0.01ms | -0.0038ms | -26.80% |
| p95 | 0.01ms | 0.03ms | -0.02ms | -54.85% |
| p99 | 0.02ms | 0.05ms | -0.03ms | -66.27% |
| mean | 0.01ms | 0.02ms | -0.0061ms | -35.48% |
| min | 0.0098ms | 0.01ms | -0.0039ms | -28.50% |
| max | 0.02ms | 0.05ms | -0.03ms | -68.18% |
| total | 0.22ms | 0.34ms | -0.12ms | -35.48% |

### loader_error_handling (5 throw + catch)

# Perf Report — loader_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0034ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.64ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.883)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.000026ms | -0.10% |
| p50 | 0.03ms | 0.03ms | -0.00083ms | -2.92% |
| p95 | 0.03ms | 0.09ms | -0.05ms | -60.03% |
| p99 | 0.04ms | 0.09ms | -0.06ms | -61.62% |
| mean | 0.03ms | 0.04ms | -0.0081ms | -22.08% |
| min | 0.03ms | 0.03ms | +0.00013ms | +0.51% |
| max | 0.04ms | 0.10ms | -0.06ms | -61.98% |
| total | 0.57ms | 0.73ms | -0.16ms | -22.08% |

