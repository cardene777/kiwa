# Perf Suite — solidjs-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| render_workflow (10 renderSolid) | 0.0095ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| signal_reactive_batch (5 signal+effect update chains) | 0.0045ms | 0.0070ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| render_error_handling (5 throw + catch in component) | 0.0076ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| render_workflow (10 renderSolid) | 0.05ms | 200ms | PASS |
| signal_reactive_batch (5 signal+effect update chains) | 0.03ms | 200ms | PASS |
| render_error_handling (5 throw + catch in component) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| render_workflow (10 renderSolid) | 10000 B | 0 B | 102400 B | yes | PASS |
| signal_reactive_batch (5 signal+effect update chains) | -3304 B | 0 B | 102400 B | yes | PASS |
| render_error_handling (5 throw + catch in component) | 5384 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### render_workflow (10 renderSolid)

# Perf Report — render_workflow (10 renderSolid).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0095ms |
| p50 | 0.0098ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0039ms |
| min | 0.0093ms |
| max | 0.02ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0095ms | 0.0093ms | +0.00021ms | +2.29% |
| p50 | 0.0098ms | 0.0095ms | +0.00031ms | +3.29% |
| p95 | 0.02ms | 0.02ms | -0.00030ms | -1.68% |
| p99 | 0.02ms | 0.02ms | +0.0053ms | +29.65% |
| mean | 0.01ms | 0.01ms | +0.00050ms | +4.60% |
| min | 0.0093ms | 0.0092ms | +0.000084ms | +0.91% |
| max | 0.02ms | 0.02ms | +0.0068ms | +37.24% |
| total | 0.23ms | 0.22ms | +0.01ms | +4.60% |

### signal_reactive_batch (5 signal+effect update chains)

# Perf Report — signal_reactive_batch (5 signal+effect update chains).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0045ms |
| p50 | 0.0047ms |
| p95 | 0.0070ms |
| p99 | 0.01ms |
| mean | 0.0055ms |
| stdev | 0.0017ms |
| min | 0.0045ms |
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0045ms | 0.0047ms | -0.00021ms | -4.38% |
| p50 | 0.0047ms | 0.0048ms | -0.00010ms | -2.14% |
| p95 | 0.0070ms | 0.0069ms | +0.00012ms | +1.78% |
| p99 | 0.01ms | 0.01ms | +0.00073ms | +6.97% |
| mean | 0.0055ms | 0.0055ms | -0.000056ms | -1.01% |
| min | 0.0045ms | 0.0047ms | -0.00021ms | -4.42% |
| max | 0.01ms | 0.01ms | +0.00088ms | +7.76% |
| total | 0.11ms | 0.11ms | -0.0011ms | -1.01% |

### render_error_handling (5 throw + catch in component)

# Perf Report — render_error_handling (5 throw + catch in component).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0076ms |
| p50 | 0.0077ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0088ms |
| stdev | 0.0025ms |
| min | 0.0075ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0076ms | 0.0079ms | -0.00029ms | -3.68% |
| p50 | 0.0077ms | 0.0080ms | -0.00027ms | -3.39% |
| p95 | 0.01ms | 0.01ms | +0.0012ms | +9.19% |
| p99 | 0.02ms | 0.01ms | +0.0011ms | +7.88% |
| mean | 0.0088ms | 0.0089ms | -0.0000085ms | -0.10% |
| min | 0.0075ms | 0.0079ms | -0.00033ms | -4.23% |
| max | 0.02ms | 0.01ms | +0.0011ms | +7.58% |
| total | 0.18ms | 0.18ms | -0.00017ms | -0.10% |

