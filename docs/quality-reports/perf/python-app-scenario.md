# Perf Suite — python-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 0.0078ms | 0.0092ms | 100ms | 0.00051ms | PASS | stable — gate 無効 (regressionGate=false) |
| template_render_batch (5 Jinja2-like renders) | 0.0027ms | 0.0062ms | 100ms | 0.00048ms | PASS | stable — gate 無効 (regressionGate=false) |
| middleware_chain_error_handling (5 throw + catch) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.04ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.0094ms | 0.01ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | cpu | 0.08ms | 0.09ms | 0.0078ms | 0.098 | 0.097 | n/a | 20.0% | 0.0079ms | 0.0078ms |
| template_render_batch (5 Jinja2-like renders) | cpu | 0.08ms | 0.09ms | 0.0027ms | 0.033 | 0.032 | n/a | 20.0% | 0.0026ms | 0.0026ms |
| middleware_chain_error_handling (5 throw + catch) | cpu | 0.08ms | 0.08ms | 0.01ms | 0.164 | 0.166 | n/a | 20.0% | 0.01ms | 0.01ms |
| retry_recovery (5 flaky async retry to success) | cpu | 0.08ms | 0.08ms | 0.03ms | 0.346 | 0.336 | n/a | 20.0% | 0.03ms | 0.03ms |
| concurrent_batch (5 batches of 4 items with error isolation) | cpu | 0.08ms | 0.08ms | 0.0094ms | 0.114 | 0.118 | n/a | 20.0% | 0.0093ms | 0.0096ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 0.04ms | 200ms | PASS |
| template_render_batch (5 Jinja2-like renders) | 0.02ms | 200ms | PASS |
| middleware_chain_error_handling (5 throw + catch) | 0.06ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.13ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | -368 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| template_render_batch (5 Jinja2-like renders) | -184 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| middleware_chain_error_handling (5 throw + catch) | 1440 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| retry_recovery (5 flaky async retry to success) | -2024 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 3984 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### rest_workflow (10 dispatch across 4 frameworks)

# Perf Report — rest_workflow (10 dispatch across 4 frameworks).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0078ms |
| p50 | 0.0081ms |
| p95 | 0.0092ms |
| p99 | 0.01ms |
| mean | 0.0083ms |
| stdev | 0.00072ms |
| min | 0.0078ms |
| max | 0.01ms |
| total | 0.17ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.012)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0079ms | 0.0078ms | +0.00014ms | +1.80% |
| p50 | 0.0082ms | 0.0086ms | -0.00038ms | -4.46% |
| p95 | 0.0093ms | 0.02ms | -0.0098ms | -51.41% |
| p99 | 0.01ms | 0.04ms | -0.03ms | -70.77% |
| mean | 0.0084ms | 0.01ms | -0.0024ms | -22.00% |
| min | 0.0079ms | 0.0077ms | +0.00018ms | +2.31% |
| max | 0.01ms | 0.04ms | -0.03ms | -73.02% |
| total | 0.17ms | 0.22ms | -0.05ms | -22.00% |

### template_render_batch (5 Jinja2-like renders)

# Perf Report — template_render_batch (5 Jinja2-like renders).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0027ms |
| p50 | 0.0035ms |
| p95 | 0.0062ms |
| p99 | 0.01ms |
| mean | 0.0039ms |
| stdev | 0.0023ms |
| min | 0.0027ms |
| max | 0.01ms |
| total | 0.08ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.957)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0026ms | 0.0026ms | +0.0000097ms | +0.38% |
| p50 | 0.0034ms | 0.0027ms | +0.00066ms | +24.66% |
| p95 | 0.0060ms | 0.0056ms | +0.00038ms | +6.73% |
| p99 | 0.01ms | 0.0058ms | +0.0055ms | +94.99% |
| mean | 0.0038ms | 0.0031ms | +0.00068ms | +22.13% |
| min | 0.0026ms | 0.0026ms | -0.000031ms | -1.18% |
| max | 0.01ms | 0.0058ms | +0.0067ms | +116.30% |
| total | 0.08ms | 0.06ms | +0.01ms | +22.13% |

### middleware_chain_error_handling (5 throw + catch)

# Perf Report — middleware_chain_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0021ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.29ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.994)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00015ms | -1.15% |
| p50 | 0.01ms | 0.01ms | +0.0000053ms | +0.04% |
| p95 | 0.02ms | 0.02ms | -0.0039ms | -20.09% |
| p99 | 0.02ms | 0.05ms | -0.03ms | -55.70% |
| mean | 0.01ms | 0.02ms | -0.0019ms | -12.02% |
| min | 0.01ms | 0.01ms | -0.000074ms | -0.56% |
| max | 0.02ms | 0.06ms | -0.03ms | -58.83% |
| total | 0.29ms | 0.32ms | -0.04ms | -12.02% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.0050ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 0.63ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.986)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.00077ms | +2.87% |
| p50 | 0.03ms | 0.03ms | -0.0012ms | -4.05% |
| p95 | 0.04ms | 0.05ms | -0.0085ms | -16.45% |
| p99 | 0.04ms | 0.08ms | -0.03ms | -41.94% |
| mean | 0.03ms | 0.03ms | -0.0032ms | -9.24% |
| min | 0.03ms | 0.03ms | +0.00076ms | +2.85% |
| max | 0.05ms | 0.08ms | -0.04ms | -45.87% |
| total | 0.62ms | 0.68ms | -0.06ms | -9.24% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0094ms |
| p50 | 0.0099ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00086ms |
| min | 0.0093ms |
| max | 0.01ms |
| total | 0.20ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.984)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0093ms | 0.0096ms | -0.00032ms | -3.30% |
| p50 | 0.0097ms | 0.01ms | -0.00043ms | -4.20% |
| p95 | 0.01ms | 0.01ms | +0.000053ms | +0.47% |
| p99 | 0.01ms | 0.01ms | +0.00045ms | +3.81% |
| mean | 0.010ms | 0.01ms | -0.00023ms | -2.22% |
| min | 0.0091ms | 0.0095ms | -0.00035ms | -3.73% |
| max | 0.01ms | 0.01ms | +0.00055ms | +4.60% |
| total | 0.20ms | 0.20ms | -0.0045ms | -2.22% |

