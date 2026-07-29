# Perf Suite — sveltekit-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| load_workflow (10 invokeLoad) | 0.0059ms | 0.0090ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| form_action_batch (5 invokeAction with FormData) | 0.10ms | 0.14ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| load_error_handling (5 throw + catch) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| load_workflow (10 invokeLoad) | 0.08ms | 200ms | PASS |
| form_action_batch (5 invokeAction with FormData) | 1.11ms | 200ms | PASS |
| load_error_handling (5 throw + catch) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| load_workflow (10 invokeLoad) | -5080 B | -9388 B | 102400 B | yes | PASS |
| form_action_batch (5 invokeAction with FormData) | 51784 B | 0 B | 102400 B | yes | PASS |
| load_error_handling (5 throw + catch) | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### load_workflow (10 invokeLoad)

# Perf Report — load_workflow (10 invokeLoad).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0059ms |
| p50 | 0.0061ms |
| p95 | 0.0090ms |
| p99 | 0.01ms |
| mean | 0.0067ms |
| stdev | 0.0016ms |
| min | 0.0058ms |
| max | 0.01ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0059ms | 0.0061ms | -0.00021ms | -3.44% |
| p50 | 0.0061ms | 0.0072ms | -0.0011ms | -15.03% |
| p95 | 0.0090ms | 0.0086ms | +0.00037ms | +4.26% |
| p99 | 0.01ms | 0.01ms | -0.0010ms | -8.05% |
| mean | 0.0067ms | 0.0073ms | -0.00064ms | -8.73% |
| min | 0.0058ms | 0.0060ms | -0.00017ms | -2.78% |
| max | 0.01ms | 0.01ms | -0.0014ms | -9.97% |
| total | 0.13ms | 0.15ms | -0.01ms | -8.73% |

### form_action_batch (5 invokeAction with FormData)

# Perf Report — form_action_batch (5 invokeAction with FormData).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.10ms |
| p50 | 0.11ms |
| p95 | 0.14ms |
| p99 | 0.16ms |
| mean | 0.12ms |
| stdev | 0.02ms |
| min | 0.10ms |
| max | 0.17ms |
| total | 2.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.10ms | 0.09ms | +0.0064ms | +6.86% |
| p50 | 0.11ms | 0.10ms | +0.0055ms | +5.26% |
| p95 | 0.14ms | 0.25ms | -0.11ms | -44.30% |
| p99 | 0.16ms | 0.34ms | -0.18ms | -52.47% |
| mean | 0.12ms | 0.13ms | -0.01ms | -10.83% |
| min | 0.10ms | 0.09ms | +0.0068ms | +7.44% |
| max | 0.17ms | 0.36ms | -0.19ms | -53.91% |
| total | 2.32ms | 2.60ms | -0.28ms | -10.83% |

### load_error_handling (5 throw + catch)

# Perf Report — load_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0039ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.04ms | -0.02ms | -65.53% |
| p50 | 0.02ms | 0.04ms | -0.03ms | -63.24% |
| p95 | 0.02ms | 0.08ms | -0.06ms | -73.56% |
| p99 | 0.03ms | 0.12ms | -0.09ms | -76.93% |
| mean | 0.02ms | 0.05ms | -0.03ms | -66.78% |
| min | 0.01ms | 0.04ms | -0.02ms | -66.14% |
| max | 0.03ms | 0.13ms | -0.10ms | -77.44% |
| total | 0.32ms | 0.97ms | -0.64ms | -66.78% |

