# Perf Suite — sveltekit-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| load_workflow (10 invokeLoad) | 0.0066ms | 0.0095ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| form_action_batch (5 invokeAction with FormData) | 0.11ms | 1.07ms | 100ms | 0.00050ms | PASS | stable (p10 +15% (閾値未満)、 p95 +322% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| load_error_handling (5 throw + catch) | 0.02ms | 0.05ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| load_workflow (10 invokeLoad) | 0.04ms | 200ms | PASS |
| form_action_batch (5 invokeAction with FormData) | 1.07ms | 200ms | PASS |
| load_error_handling (5 throw + catch) | 0.09ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| load_workflow (10 invokeLoad) | -5544 B | -9401 B | 102400 B | yes | PASS |
| form_action_batch (5 invokeAction with FormData) | 26608 B | -29380 B | 102400 B | yes | PASS |
| load_error_handling (5 throw + catch) | 2872 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### load_workflow (10 invokeLoad)

# Perf Report — load_workflow (10 invokeLoad).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0066ms |
| p50 | 0.0067ms |
| p95 | 0.0095ms |
| p99 | 0.01ms |
| mean | 0.0074ms |
| stdev | 0.0019ms |
| min | 0.0066ms |
| max | 0.01ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0066ms | 0.0061ms | +0.00054ms | +8.90% |
| p50 | 0.0067ms | 0.0072ms | -0.00050ms | -6.94% |
| p95 | 0.0095ms | 0.0086ms | +0.00093ms | +10.76% |
| p99 | 0.01ms | 0.01ms | +0.0011ms | +8.51% |
| mean | 0.0074ms | 0.0073ms | +0.000069ms | +0.93% |
| min | 0.0066ms | 0.0060ms | +0.00058ms | +9.72% |
| max | 0.01ms | 0.01ms | +0.0011ms | +8.16% |
| total | 0.15ms | 0.15ms | +0.0014ms | +0.93% |

### form_action_batch (5 invokeAction with FormData)

# Perf Report — form_action_batch (5 invokeAction with FormData).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.11ms |
| p50 | 0.12ms |
| p95 | 1.07ms |
| p99 | 2.01ms |
| mean | 0.30ms |
| stdev | 0.50ms |
| min | 0.11ms |
| max | 2.25ms |
| total | 6.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.11ms | 0.09ms | +0.01ms | +15.17% |
| p50 | 0.12ms | 0.10ms | +0.02ms | +15.41% |
| p95 | 1.07ms | 0.25ms | +0.82ms | +322.21% |
| p99 | 2.01ms | 0.34ms | +1.67ms | +492.39% |
| mean | 0.30ms | 0.13ms | +0.17ms | +134.36% |
| min | 0.11ms | 0.09ms | +0.02ms | +17.52% |
| max | 2.25ms | 0.36ms | +1.89ms | +522.35% |
| total | 6.09ms | 2.60ms | +3.49ms | +134.36% |

### load_error_handling (5 throw + catch)

# Perf Report — load_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.05ms |
| p99 | 0.08ms |
| mean | 0.03ms |
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.09ms |
| total | 0.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.04ms | -0.02ms | -48.32% |
| p50 | 0.02ms | 0.04ms | -0.02ms | -50.38% |
| p95 | 0.05ms | 0.08ms | -0.03ms | -32.78% |
| p99 | 0.08ms | 0.12ms | -0.04ms | -34.09% |
| mean | 0.03ms | 0.05ms | -0.02ms | -46.27% |
| min | 0.02ms | 0.04ms | -0.02ms | -48.87% |
| max | 0.09ms | 0.13ms | -0.05ms | -34.28% |
| total | 0.52ms | 0.97ms | -0.45ms | -46.27% |

