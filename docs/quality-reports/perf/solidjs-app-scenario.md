# Perf Suite — solidjs-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| render_workflow (10 renderSolid) | 0.0095ms | 0.02ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| signal_reactive_batch (5 signal+effect update chains) | 0.0046ms | 0.0076ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| render_error_handling (5 throw + catch in component) | 0.0076ms | 0.01ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| render_workflow (10 renderSolid) | 0.07ms | 200ms | PASS |
| signal_reactive_batch (5 signal+effect update chains) | 0.03ms | 200ms | PASS |
| render_error_handling (5 throw + catch in component) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| render_workflow (10 renderSolid) | 31048 B | 0 B | 102400 B | yes | PASS |
| signal_reactive_batch (5 signal+effect update chains) | 4832 B | 0 B | 102400 B | yes | PASS |
| render_error_handling (5 throw + catch in component) | 5432 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### render_workflow (10 renderSolid)

# Perf Report — render_workflow (10 renderSolid).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0095ms |
| p50 | 0.0096ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0030ms |
| min | 0.0094ms |
| max | 0.02ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0095ms | 0.0093ms | +0.00018ms | +1.89% |
| p50 | 0.0096ms | 0.0095ms | +0.00015ms | +1.53% |
| p95 | 0.02ms | 0.02ms | +0.00051ms | +2.92% |
| p99 | 0.02ms | 0.02ms | +0.00070ms | +3.90% |
| mean | 0.01ms | 0.01ms | +0.00059ms | +5.42% |
| min | 0.0094ms | 0.0092ms | +0.00021ms | +2.27% |
| max | 0.02ms | 0.02ms | +0.00075ms | +4.14% |
| total | 0.23ms | 0.22ms | +0.01ms | +5.42% |

### signal_reactive_batch (5 signal+effect update chains)

# Perf Report — signal_reactive_batch (5 signal+effect update chains).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0046ms |
| p50 | 0.0046ms |
| p95 | 0.0076ms |
| p99 | 0.010ms |
| mean | 0.0054ms |
| stdev | 0.0015ms |
| min | 0.0045ms |
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0046ms | 0.0047ms | -0.00017ms | -3.52% |
| p50 | 0.0046ms | 0.0048ms | -0.00019ms | -3.88% |
| p95 | 0.0076ms | 0.0069ms | +0.00072ms | +10.38% |
| p99 | 0.010ms | 0.01ms | -0.00042ms | -4.06% |
| mean | 0.0054ms | 0.0055ms | -0.00020ms | -3.53% |
| min | 0.0045ms | 0.0047ms | -0.00017ms | -3.55% |
| max | 0.01ms | 0.01ms | -0.00071ms | -6.26% |
| total | 0.11ms | 0.11ms | -0.0039ms | -3.53% |

### render_error_handling (5 throw + catch in component)

# Perf Report — render_error_handling (5 throw + catch in component).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0076ms |
| p50 | 0.0078ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0085ms |
| stdev | 0.0022ms |
| min | 0.0076ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0076ms | 0.0079ms | -0.00029ms | -3.68% |
| p50 | 0.0078ms | 0.0080ms | -0.00021ms | -2.61% |
| p95 | 0.01ms | 0.01ms | -0.0011ms | -8.01% |
| p99 | 0.02ms | 0.01ms | +0.0014ms | +9.95% |
| mean | 0.0085ms | 0.0089ms | -0.00035ms | -4.00% |
| min | 0.0076ms | 0.0079ms | -0.00029ms | -3.71% |
| max | 0.02ms | 0.01ms | +0.0021ms | +14.04% |
| total | 0.17ms | 0.18ms | -0.0071ms | -4.00% |

