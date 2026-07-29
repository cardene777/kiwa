# Perf Suite — solidjs-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| render_workflow (10 renderSolid) | 0.0096ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| signal_reactive_batch (5 signal+effect update chains) | 0.0059ms | 0.01ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| render_error_handling (5 throw + catch in component) | 0.0079ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| render_workflow (10 renderSolid) | 0.05ms | 200ms | PASS |
| signal_reactive_batch (5 signal+effect update chains) | 0.04ms | 200ms | PASS |
| render_error_handling (5 throw + catch in component) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| render_workflow (10 renderSolid) | 6560 B | 0 B | 102400 B | yes | PASS |
| signal_reactive_batch (5 signal+effect update chains) | 4832 B | 0 B | 102400 B | yes | PASS |
| render_error_handling (5 throw + catch in component) | 5432 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### render_workflow (10 renderSolid)

# Perf Report — render_workflow (10 renderSolid).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0096ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0034ms |
| min | 0.0095ms |
| max | 0.02ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0096ms | 0.0093ms | +0.00030ms | +3.18% |
| p50 | 0.01ms | 0.0095ms | +0.0029ms | +30.26% |
| p95 | 0.02ms | 0.02ms | +0.00054ms | +3.08% |
| p99 | 0.02ms | 0.02ms | +0.0024ms | +13.56% |
| mean | 0.01ms | 0.01ms | +0.0016ms | +14.72% |
| min | 0.0095ms | 0.0092ms | +0.00025ms | +2.72% |
| max | 0.02ms | 0.02ms | +0.0029ms | +16.09% |
| total | 0.25ms | 0.22ms | +0.03ms | +14.72% |

### signal_reactive_batch (5 signal+effect update chains)

# Perf Report — signal_reactive_batch (5 signal+effect update chains).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0059ms |
| p50 | 0.0060ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0075ms |
| stdev | 0.0045ms |
| min | 0.0059ms |
| max | 0.03ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0059ms | 0.0047ms | +0.0012ms | +24.46% |
| p50 | 0.0060ms | 0.0048ms | +0.0012ms | +24.15% |
| p95 | 0.01ms | 0.0069ms | +0.0059ms | +85.47% |
| p99 | 0.02ms | 0.01ms | +0.01ms | +120.49% |
| mean | 0.0075ms | 0.0055ms | +0.0019ms | +34.58% |
| min | 0.0059ms | 0.0047ms | +0.0012ms | +24.79% |
| max | 0.03ms | 0.01ms | +0.01ms | +125.84% |
| total | 0.15ms | 0.11ms | +0.04ms | +34.58% |

### render_error_handling (5 throw + catch in component)

# Perf Report — render_error_handling (5 throw + catch in component).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0079ms |
| p50 | 0.0080ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0086ms |
| stdev | 0.0021ms |
| min | 0.0078ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0079ms | 0.0079ms | -0.000041ms | -0.52% |
| p50 | 0.0080ms | 0.0080ms | -0.000042ms | -0.53% |
| p95 | 0.01ms | 0.01ms | -0.0031ms | -23.11% |
| p99 | 0.02ms | 0.01ms | +0.0013ms | +8.75% |
| mean | 0.0086ms | 0.0089ms | -0.00023ms | -2.62% |
| min | 0.0078ms | 0.0079ms | -0.000083ms | -1.05% |
| max | 0.02ms | 0.01ms | +0.0024ms | +16.01% |
| total | 0.17ms | 0.18ms | -0.0046ms | -2.62% |

