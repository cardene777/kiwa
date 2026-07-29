# Perf Suite — solidjs-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| render_workflow (10 renderSolid) | 0.0095ms | 0.02ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| signal_reactive_batch (5 signal+effect update chains) | 0.0045ms | 0.0073ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| render_error_handling (5 throw + catch in component) | 0.0077ms | 0.03ms | 100ms | 0.00042ms | PASS | stable (p10 -3% (閾値未満)、 p95 +87% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| render_workflow (10 renderSolid) | 0.05ms | 200ms | PASS |
| signal_reactive_batch (5 signal+effect update chains) | 0.05ms | 200ms | PASS |
| render_error_handling (5 throw + catch in component) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| render_workflow (10 renderSolid) | 18696 B | 0 B | 102400 B | yes | PASS |
| signal_reactive_batch (5 signal+effect update chains) | -4600 B | 0 B | 102400 B | yes | PASS |
| render_error_handling (5 throw + catch in component) | 5384 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### render_workflow (10 renderSolid)

# Perf Report — render_workflow (10 renderSolid).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0095ms |
| p50 | 0.0097ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0026ms |
| min | 0.0092ms |
| max | 0.02ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0095ms | 0.0093ms | +0.00020ms | +2.11% |
| p50 | 0.0097ms | 0.0095ms | +0.00023ms | +2.41% |
| p95 | 0.02ms | 0.02ms | -0.00068ms | -3.86% |
| p99 | 0.02ms | 0.02ms | -0.00024ms | -1.31% |
| mean | 0.01ms | 0.01ms | -0.000018ms | -0.17% |
| min | 0.0092ms | 0.0092ms | +0.000042ms | +0.46% |
| max | 0.02ms | 0.02ms | -0.00013ms | -0.69% |
| total | 0.22ms | 0.22ms | -0.00037ms | -0.17% |

### signal_reactive_batch (5 signal+effect update chains)

# Perf Report — signal_reactive_batch (5 signal+effect update chains).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0045ms |
| p50 | 0.0048ms |
| p95 | 0.0073ms |
| p99 | 0.01ms |
| mean | 0.0055ms |
| stdev | 0.0015ms |
| min | 0.0045ms |
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0045ms | 0.0047ms | -0.00021ms | -4.40% |
| p50 | 0.0048ms | 0.0048ms | -0.000041ms | -0.86% |
| p95 | 0.0073ms | 0.0069ms | +0.00037ms | +5.38% |
| p99 | 0.01ms | 0.01ms | -0.00032ms | -3.12% |
| mean | 0.0055ms | 0.0055ms | -0.000071ms | -1.28% |
| min | 0.0045ms | 0.0047ms | -0.00021ms | -4.42% |
| max | 0.01ms | 0.01ms | -0.00050ms | -4.42% |
| total | 0.11ms | 0.11ms | -0.0014ms | -1.28% |

### render_error_handling (5 throw + catch in component)

# Perf Report — render_error_handling (5 throw + catch in component).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0077ms |
| p50 | 0.0078ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0059ms |
| min | 0.0076ms |
| max | 0.03ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0077ms | 0.0079ms | -0.00025ms | -3.16% |
| p50 | 0.0078ms | 0.0080ms | -0.00021ms | -2.61% |
| p95 | 0.03ms | 0.01ms | +0.01ms | +87.45% |
| p99 | 0.03ms | 0.01ms | +0.01ms | +89.44% |
| mean | 0.01ms | 0.0089ms | +0.0014ms | +15.79% |
| min | 0.0076ms | 0.0079ms | -0.00029ms | -3.71% |
| max | 0.03ms | 0.01ms | +0.01ms | +89.89% |
| total | 0.20ms | 0.18ms | +0.03ms | +15.79% |

