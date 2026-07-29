# Perf Suite — solidjs-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| render_workflow (10 renderSolid) | 0.0092ms | 0.02ms | 100ms | 0.00049ms | PASS | stable (p10 -0% (閾値未満)、 p95 +27% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| signal_reactive_batch (5 signal+effect update chains) | 0.0046ms | 0.0068ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| render_error_handling (5 throw + catch in component) | 0.0074ms | 0.01ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| render_workflow (10 renderSolid) | 0.05ms | 200ms | PASS |
| signal_reactive_batch (5 signal+effect update chains) | 0.03ms | 200ms | PASS |
| render_error_handling (5 throw + catch in component) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| render_workflow (10 renderSolid) | 27904 B | 0 B | 102400 B | yes | PASS |
| signal_reactive_batch (5 signal+effect update chains) | -3304 B | 0 B | 102400 B | yes | PASS |
| render_error_handling (5 throw + catch in component) | 5384 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### render_workflow (10 renderSolid)

# Perf Report — render_workflow (10 renderSolid).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0092ms |
| p50 | 0.010ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0063ms |
| min | 0.0092ms |
| max | 0.04ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0092ms | 0.0093ms | -0.000038ms | -0.41% |
| p50 | 0.010ms | 0.0095ms | +0.00046ms | +4.83% |
| p95 | 0.02ms | 0.02ms | +0.0048ms | +27.43% |
| p99 | 0.03ms | 0.02ms | +0.02ms | +85.29% |
| mean | 0.01ms | 0.01ms | +0.0012ms | +10.88% |
| min | 0.0092ms | 0.0092ms | -0.000041ms | -0.45% |
| max | 0.04ms | 0.02ms | +0.02ms | +99.31% |
| total | 0.24ms | 0.22ms | +0.02ms | +10.88% |

### signal_reactive_batch (5 signal+effect update chains)

# Perf Report — signal_reactive_batch (5 signal+effect update chains).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0046ms |
| p50 | 0.0047ms |
| p95 | 0.0068ms |
| p99 | 0.0098ms |
| mean | 0.0054ms |
| stdev | 0.0014ms |
| min | 0.0045ms |
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0046ms | 0.0047ms | -0.00017ms | -3.50% |
| p50 | 0.0047ms | 0.0048ms | -0.000083ms | -1.72% |
| p95 | 0.0068ms | 0.0069ms | -0.000079ms | -1.15% |
| p99 | 0.0098ms | 0.01ms | -0.00065ms | -6.23% |
| mean | 0.0054ms | 0.0055ms | -0.00016ms | -2.81% |
| min | 0.0045ms | 0.0047ms | -0.00017ms | -3.53% |
| max | 0.01ms | 0.01ms | -0.00079ms | -7.01% |
| total | 0.11ms | 0.11ms | -0.0031ms | -2.81% |

### render_error_handling (5 throw + catch in component)

# Perf Report — render_error_handling (5 throw + catch in component).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0074ms |
| p50 | 0.0076ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0085ms |
| stdev | 0.0026ms |
| min | 0.0074ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0074ms | 0.0079ms | -0.00050ms | -6.32% |
| p50 | 0.0076ms | 0.0080ms | -0.00044ms | -5.47% |
| p95 | 0.01ms | 0.01ms | -0.00063ms | -4.63% |
| p99 | 0.02ms | 0.01ms | +0.0025ms | +17.21% |
| mean | 0.0085ms | 0.0089ms | -0.00039ms | -4.40% |
| min | 0.0074ms | 0.0079ms | -0.00050ms | -6.35% |
| max | 0.02ms | 0.01ms | +0.0033ms | +22.19% |
| total | 0.17ms | 0.18ms | -0.0078ms | -4.40% |

