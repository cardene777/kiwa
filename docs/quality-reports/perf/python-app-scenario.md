# Perf Suite — python-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 0.0082ms | 0.0098ms | 100ms | 0.00047ms | PASS | stable — gate 無効 (regressionGate=false) |
| template_render_batch (5 Jinja2-like renders) | 0.0030ms | 0.0069ms | 100ms | 0.00047ms | PASS | stable — gate 無効 (regressionGate=false) |
| middleware_chain_error_handling (5 throw + catch) | 0.01ms | 0.02ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.04ms | 100ms | 0.00048ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.01ms | 0.02ms | 100ms | 0.00049ms | PASS | stable (換算後 p10 +5% (閾値未満)、 p95 +68% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | cpu | 0.09ms | 0.10ms | 0.0082ms | 0.096 | 0.097 | 0.0077ms | 0.0078ms |
| template_render_batch (5 Jinja2-like renders) | cpu | 0.08ms | 0.09ms | 0.0030ms | 0.035 | 0.032 | 0.0028ms | 0.0026ms |
| middleware_chain_error_handling (5 throw + catch) | cpu | 0.08ms | 0.08ms | 0.01ms | 0.158 | 0.166 | 0.01ms | 0.01ms |
| retry_recovery (5 flaky async retry to success) | cpu | 0.08ms | 0.08ms | 0.03ms | 0.337 | 0.336 | 0.03ms | 0.03ms |
| concurrent_batch (5 batches of 4 items with error isolation) | cpu | 0.08ms | 0.08ms | 0.01ms | 0.124 | 0.118 | 0.01ms | 0.0096ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 0.13ms | 200ms | PASS |
| template_render_batch (5 Jinja2-like renders) | 0.02ms | 200ms | PASS |
| middleware_chain_error_handling (5 throw + catch) | 0.06ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.14ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 5352 B | 0 B | 102400 B | yes | PASS |
| template_render_batch (5 Jinja2-like renders) | 752 B | 0 B | 102400 B | yes | PASS |
| middleware_chain_error_handling (5 throw + catch) | 1376 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 4192 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 576 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_workflow (10 dispatch across 4 frameworks)

# Perf Report — rest_workflow (10 dispatch across 4 frameworks).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0082ms |
| p50 | 0.0086ms |
| p95 | 0.0098ms |
| p99 | 0.01ms |
| mean | 0.0087ms |
| stdev | 0.00059ms |
| min | 0.0082ms |
| max | 0.01ms |
| total | 0.17ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.941)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0077ms | 0.0078ms | -0.000067ms | -0.86% |
| p50 | 0.0081ms | 0.0086ms | -0.00051ms | -5.94% |
| p95 | 0.0092ms | 0.02ms | -0.0099ms | -51.66% |
| p99 | 0.0096ms | 0.04ms | -0.03ms | -73.70% |
| mean | 0.0082ms | 0.01ms | -0.0026ms | -24.14% |
| min | 0.0077ms | 0.0077ms | -0.000026ms | -0.33% |
| max | 0.0097ms | 0.04ms | -0.03ms | -76.27% |
| total | 0.16ms | 0.22ms | -0.05ms | -24.14% |

### template_render_batch (5 Jinja2-like renders)

# Perf Report — template_render_batch (5 Jinja2-like renders).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0030ms |
| p50 | 0.0038ms |
| p95 | 0.0069ms |
| p99 | 0.0074ms |
| mean | 0.0043ms |
| stdev | 0.0014ms |
| min | 0.0029ms |
| max | 0.0075ms |
| total | 0.09ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.939)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0028ms | 0.0026ms | +0.00023ms | +8.94% |
| p50 | 0.0036ms | 0.0027ms | +0.00091ms | +33.98% |
| p95 | 0.0065ms | 0.0056ms | +0.00089ms | +15.98% |
| p99 | 0.0069ms | 0.0058ms | +0.0012ms | +20.55% |
| mean | 0.0040ms | 0.0031ms | +0.00092ms | +29.70% |
| min | 0.0027ms | 0.0026ms | +0.00016ms | +6.08% |
| max | 0.0070ms | 0.0058ms | +0.0013ms | +21.65% |
| total | 0.08ms | 0.06ms | +0.02ms | +29.70% |

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
| stdev | 0.0023ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.28ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.973)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00061ms | -4.54% |
| p50 | 0.01ms | 0.01ms | -0.00053ms | -3.88% |
| p95 | 0.02ms | 0.02ms | -0.0041ms | -20.66% |
| p99 | 0.02ms | 0.05ms | -0.03ms | -55.55% |
| mean | 0.01ms | 0.02ms | -0.0024ms | -14.98% |
| min | 0.01ms | 0.01ms | -0.00064ms | -4.84% |
| max | 0.02ms | 0.06ms | -0.03ms | -58.62% |
| total | 0.28ms | 0.32ms | -0.05ms | -14.98% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0046ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 0.63ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.962)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.000064ms | +0.24% |
| p50 | 0.03ms | 0.03ms | -0.0010ms | -3.35% |
| p95 | 0.04ms | 0.05ms | -0.01ms | -27.39% |
| p99 | 0.04ms | 0.08ms | -0.03ms | -44.34% |
| mean | 0.03ms | 0.03ms | -0.0038ms | -11.07% |
| min | 0.03ms | 0.03ms | -0.00020ms | -0.76% |
| max | 0.04ms | 0.08ms | -0.04ms | -46.95% |
| total | 0.61ms | 0.68ms | -0.08ms | -11.07% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0035ms |
| min | 0.010ms |
| max | 0.02ms |
| total | 0.26ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.986)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0096ms | +0.00052ms | +5.41% |
| p50 | 0.01ms | 0.01ms | +0.0011ms | +10.41% |
| p95 | 0.02ms | 0.01ms | +0.0078ms | +68.37% |
| p99 | 0.02ms | 0.01ms | +0.0083ms | +69.79% |
| mean | 0.01ms | 0.01ms | +0.0028ms | +27.90% |
| min | 0.0098ms | 0.0095ms | +0.00032ms | +3.39% |
| max | 0.02ms | 0.01ms | +0.0084ms | +70.13% |
| total | 0.26ms | 0.20ms | +0.06ms | +27.90% |

