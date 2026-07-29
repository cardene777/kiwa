# Perf Suite — sveltekit-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| load_workflow (10 invokeLoad) | 0.0058ms | 0.01ms | 100ms | 0.00050ms | PASS | stable (p10 -4% (閾値未満)、 p95 +24% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| form_action_batch (5 invokeAction with FormData) | 0.10ms | 0.15ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| load_error_handling (5 throw + catch) | 0.02ms | 0.09ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| load_workflow (10 invokeLoad) | 0.04ms | 200ms | PASS |
| form_action_batch (5 invokeAction with FormData) | 0.64ms | 200ms | PASS |
| load_error_handling (5 throw + catch) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| load_workflow (10 invokeLoad) | 2392 B | 0 B | 102400 B | yes | PASS |
| form_action_batch (5 invokeAction with FormData) | 53072 B | -17578 B | 102400 B | yes | PASS |
| load_error_handling (5 throw + catch) | -408 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### load_workflow (10 invokeLoad)

# Perf Report — load_workflow (10 invokeLoad).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0058ms |
| p50 | 0.0060ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0068ms |
| stdev | 0.0020ms |
| min | 0.0058ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0058ms | 0.0061ms | -0.00025ms | -4.04% |
| p50 | 0.0060ms | 0.0072ms | -0.0012ms | -16.47% |
| p95 | 0.01ms | 0.0086ms | +0.0021ms | +24.13% |
| p99 | 0.01ms | 0.01ms | +0.00072ms | +5.61% |
| mean | 0.0068ms | 0.0073ms | -0.00052ms | -7.03% |
| min | 0.0058ms | 0.0060ms | -0.00021ms | -3.47% |
| max | 0.01ms | 0.01ms | +0.00038ms | +2.72% |
| total | 0.14ms | 0.15ms | -0.01ms | -7.03% |

### form_action_batch (5 invokeAction with FormData)

# Perf Report — form_action_batch (5 invokeAction with FormData).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.10ms |
| p50 | 0.11ms |
| p95 | 0.15ms |
| p99 | 0.20ms |
| mean | 0.12ms |
| stdev | 0.03ms |
| min | 0.10ms |
| max | 0.21ms |
| total | 2.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.10ms | 0.09ms | +0.0063ms | +6.73% |
| p50 | 0.11ms | 0.10ms | +0.0078ms | +7.45% |
| p95 | 0.15ms | 0.25ms | -0.10ms | -40.11% |
| p99 | 0.20ms | 0.34ms | -0.14ms | -42.31% |
| mean | 0.12ms | 0.13ms | -0.01ms | -8.06% |
| min | 0.10ms | 0.09ms | +0.0057ms | +6.25% |
| max | 0.21ms | 0.36ms | -0.15ms | -42.70% |
| total | 2.39ms | 2.60ms | -0.21ms | -8.06% |

### load_error_handling (5 throw + catch)

# Perf Report — load_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.09ms |
| p99 | 0.17ms |
| mean | 0.04ms |
| stdev | 0.04ms |
| min | 0.01ms |
| max | 0.19ms |
| total | 0.71ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.04ms | -0.02ms | -59.61% |
| p50 | 0.02ms | 0.04ms | -0.02ms | -58.84% |
| p95 | 0.09ms | 0.08ms | +0.01ms | +15.85% |
| p99 | 0.17ms | 0.12ms | +0.05ms | +37.36% |
| mean | 0.04ms | 0.05ms | -0.01ms | -26.85% |
| min | 0.01ms | 0.04ms | -0.02ms | -61.29% |
| max | 0.19ms | 0.13ms | +0.05ms | +40.60% |
| total | 0.71ms | 0.97ms | -0.26ms | -26.85% |

