# Perf Suite — nextjs-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | 0.0047ms | 0.0062ms | 100ms | 0.00048ms | PASS | stable — gate 無効 (regressionGate=false) |
| form_submission_batch (5 invoke with FormData) | 0.0040ms | 0.0054ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| action_error_handling (5 throw + catch) | 0.02ms | 0.02ms | 100ms | 0.00048ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | cpu | 0.09ms | 0.10ms | 0.0047ms | 0.055 | 0.057 | n/a | 20.0% | 0.0046ms | 0.0048ms |
| form_submission_batch (5 invoke with FormData) | cpu | 0.10ms | 0.10ms | 0.0040ms | 0.041 | 0.041 | n/a | 20.0% | 0.0034ms | 0.0033ms |
| action_error_handling (5 throw + catch) | cpu | 0.09ms | 0.09ms | 0.02ms | 0.227 | 0.223 | n/a | 20.0% | 0.02ms | 0.02ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | 0.03ms | 200ms | PASS |
| form_submission_batch (5 invoke with FormData) | 0.02ms | 200ms | PASS |
| action_error_handling (5 throw + catch) | 0.09ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | -12104 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| form_submission_batch (5 invoke with FormData) | 2872 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| action_error_handling (5 throw + catch) | 744 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### server_action_workflow (10 invokeServerAction)

# Perf Report — server_action_workflow (10 invokeServerAction).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0047ms |
| p50 | 0.0050ms |
| p95 | 0.0062ms |
| p99 | 0.0067ms |
| mean | 0.0052ms |
| stdev | 0.00057ms |
| min | 0.0047ms |
| max | 0.0068ms |
| total | 0.10ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.963)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0046ms | 0.0048ms | -0.00021ms | -4.48% |
| p50 | 0.0048ms | 0.0050ms | -0.00021ms | -4.12% |
| p95 | 0.0060ms | 0.02ms | -0.01ms | -68.32% |
| p99 | 0.0065ms | 0.03ms | -0.02ms | -76.77% |
| mean | 0.0050ms | 0.0078ms | -0.0028ms | -36.07% |
| min | 0.0045ms | 0.0047ms | -0.00026ms | -5.42% |
| max | 0.0066ms | 0.03ms | -0.02ms | -78.10% |
| total | 0.10ms | 0.16ms | -0.06ms | -36.07% |

### form_submission_batch (5 invoke with FormData)

# Perf Report — form_submission_batch (5 invoke with FormData).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0040ms |
| p50 | 0.0041ms |
| p95 | 0.0054ms |
| p99 | 0.0055ms |
| mean | 0.0043ms |
| stdev | 0.00045ms |
| min | 0.0040ms |
| max | 0.0055ms |
| total | 0.09ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.842)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0034ms | 0.0033ms | +0.000065ms | +1.96% |
| p50 | 0.0035ms | 0.0037ms | -0.00028ms | -7.37% |
| p95 | 0.0046ms | 0.0080ms | -0.0034ms | -42.97% |
| p99 | 0.0046ms | 0.04ms | -0.04ms | -89.07% |
| mean | 0.0037ms | 0.0063ms | -0.0026ms | -41.77% |
| min | 0.0034ms | 0.0033ms | +0.000076ms | +2.32% |
| max | 0.0046ms | 0.05ms | -0.05ms | -90.89% |
| total | 0.07ms | 0.13ms | -0.05ms | -41.77% |

### action_error_handling (5 throw + catch)

# Perf Report — action_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.0016ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.41ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.966)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00028ms | +1.51% |
| p50 | 0.02ms | 0.02ms | +0.00027ms | +1.45% |
| p95 | 0.02ms | 0.05ms | -0.02ms | -48.88% |
| p99 | 0.02ms | 0.05ms | -0.02ms | -47.81% |
| mean | 0.02ms | 0.02ms | -0.0020ms | -9.33% |
| min | 0.02ms | 0.02ms | +0.00021ms | +1.12% |
| max | 0.02ms | 0.05ms | -0.02ms | -47.56% |
| total | 0.40ms | 0.44ms | -0.04ms | -9.33% |

