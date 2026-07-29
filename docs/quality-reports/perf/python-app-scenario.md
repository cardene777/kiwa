# Perf Suite — python-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 0.0080ms | 0.0095ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| template_render_batch (5 Jinja2-like renders) | 0.0026ms | 0.0053ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| middleware_chain_error_handling (5 throw + catch) | 0.01ms | 0.02ms | 100ms | 0.00043ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.04ms | 100ms | 0.00043ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.01ms | 0.02ms | 100ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | cpu | 0.08ms | 0.0080ms | 0.098 | 0.095 | 0.0080ms | 0.0078ms |
| template_render_batch (5 Jinja2-like renders) | cpu | 0.08ms | 0.0026ms | 0.032 | 0.034 | 0.0026ms | 0.0027ms |
| middleware_chain_error_handling (5 throw + catch) | cpu | 0.08ms | 0.01ms | 0.158 | 0.159 | 0.01ms | 0.01ms |
| retry_recovery (5 flaky async retry to success) | cpu | 0.08ms | 0.03ms | 0.386 | 0.337 | 0.03ms | 0.03ms |
| concurrent_batch (5 batches of 4 items with error isolation) | cpu | 0.08ms | 0.01ms | 0.140 | 0.119 | 0.01ms | 0.0097ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 0.04ms | 200ms | PASS |
| template_render_batch (5 Jinja2-like renders) | 0.02ms | 200ms | PASS |
| middleware_chain_error_handling (5 throw + catch) | 0.06ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.12ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 880 B | 0 B | 102400 B | yes | PASS |
| template_render_batch (5 Jinja2-like renders) | -104 B | 0 B | 102400 B | yes | PASS |
| middleware_chain_error_handling (5 throw + catch) | 1440 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | -2696 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 5440 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_workflow (10 dispatch across 4 frameworks)

# Perf Report — rest_workflow (10 dispatch across 4 frameworks).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0080ms |
| p50 | 0.0082ms |
| p95 | 0.0095ms |
| p99 | 0.0098ms |
| mean | 0.0084ms |
| stdev | 0.00054ms |
| min | 0.0080ms |
| max | 0.0098ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0080ms | 0.0078ms | +0.00022ms | +2.84% |
| p50 | 0.0082ms | 0.0083ms | -0.00013ms | -1.51% |
| p95 | 0.0095ms | 0.0097ms | -0.00027ms | -2.79% |
| p99 | 0.0098ms | 0.01ms | -0.00059ms | -5.67% |
| mean | 0.0084ms | 0.0084ms | -0.000042ms | -0.49% |
| min | 0.0080ms | 0.0076ms | +0.00033ms | +4.37% |
| max | 0.0098ms | 0.01ms | -0.00067ms | -6.34% |
| total | 0.17ms | 0.17ms | -0.00083ms | -0.49% |

### template_render_batch (5 Jinja2-like renders)

# Perf Report — template_render_batch (5 Jinja2-like renders).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0026ms |
| p50 | 0.0027ms |
| p95 | 0.0053ms |
| p99 | 0.0056ms |
| mean | 0.0031ms |
| stdev | 0.00086ms |
| min | 0.0026ms |
| max | 0.0057ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0026ms | 0.0027ms | -0.00012ms | -4.40% |
| p50 | 0.0027ms | 0.0029ms | -0.00015ms | -5.06% |
| p95 | 0.0053ms | 0.0090ms | -0.0038ms | -41.64% |
| p99 | 0.0056ms | 0.02ms | -0.02ms | -76.71% |
| mean | 0.0031ms | 0.0044ms | -0.0014ms | -30.57% |
| min | 0.0026ms | 0.0027ms | -0.000084ms | -3.15% |
| max | 0.0057ms | 0.03ms | -0.02ms | -79.55% |
| total | 0.06ms | 0.09ms | -0.03ms | -30.57% |

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

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00033ms | -2.54% |
| p50 | 0.01ms | 0.01ms | -0.00077ms | -5.57% |
| p95 | 0.02ms | 0.02ms | +0.00027ms | +1.72% |
| p99 | 0.02ms | 0.02ms | -0.00078ms | -3.51% |
| mean | 0.01ms | 0.01ms | -0.00047ms | -3.32% |
| min | 0.01ms | 0.01ms | -0.00029ms | -2.25% |
| max | 0.02ms | 0.02ms | -0.0010ms | -4.36% |
| total | 0.28ms | 0.29ms | -0.0095ms | -3.32% |

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
| stdev | 0.0029ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.69ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.0035ms | +12.37% |
| p50 | 0.03ms | 0.03ms | +0.0045ms | +15.31% |
| p95 | 0.04ms | 0.06ms | -0.02ms | -35.88% |
| p99 | 0.04ms | 0.10ms | -0.05ms | -56.24% |
| mean | 0.03ms | 0.04ms | -0.0027ms | -7.22% |
| min | 0.03ms | 0.03ms | +0.0042ms | +15.41% |
| max | 0.04ms | 0.11ms | -0.06ms | -59.22% |
| total | 0.69ms | 0.74ms | -0.05ms | -7.22% |

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
| stdev | 0.0013ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0097ms | +0.0019ms | +19.56% |
| p50 | 0.01ms | 0.01ms | +0.0020ms | +18.85% |
| p95 | 0.02ms | 0.02ms | -0.0015ms | -9.12% |
| p99 | 0.02ms | 0.03ms | -0.01ms | -37.98% |
| mean | 0.01ms | 0.01ms | +0.00047ms | +3.80% |
| min | 0.01ms | 0.0096ms | +0.0018ms | +18.70% |
| max | 0.02ms | 0.03ms | -0.01ms | -42.14% |
| total | 0.25ms | 0.25ms | +0.0093ms | +3.80% |

