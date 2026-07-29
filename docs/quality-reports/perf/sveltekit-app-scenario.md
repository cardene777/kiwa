# Perf Suite — sveltekit-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| load_workflow (10 invokeLoad) | 0.0060ms | 0.0086ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| form_action_batch (5 invokeAction with FormData) | 0.10ms | 0.27ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| load_error_handling (5 throw + catch) | 0.01ms | 0.02ms | 100ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| load_workflow (10 invokeLoad) | 0.03ms | 200ms | PASS |
| form_action_batch (5 invokeAction with FormData) | 0.86ms | 200ms | PASS |
| load_error_handling (5 throw + catch) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| load_workflow (10 invokeLoad) | 7232 B | 0 B | 102400 B | yes | PASS |
| form_action_batch (5 invokeAction with FormData) | 27312 B | 0 B | 102400 B | yes | PASS |
| load_error_handling (5 throw + catch) | -40 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### load_workflow (10 invokeLoad)

# Perf Report — load_workflow (10 invokeLoad).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0060ms |
| p50 | 0.0062ms |
| p95 | 0.0086ms |
| p99 | 0.01ms |
| mean | 0.0068ms |
| stdev | 0.0017ms |
| min | 0.0059ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0060ms | 0.0061ms | -0.000042ms | -0.69% |
| p50 | 0.0062ms | 0.0072ms | -0.0010ms | -14.45% |
| p95 | 0.0086ms | 0.0086ms | +0.000016ms | +0.19% |
| p99 | 0.01ms | 0.01ms | -0.00036ms | -2.85% |
| mean | 0.0068ms | 0.0073ms | -0.00056ms | -7.60% |
| min | 0.0059ms | 0.0060ms | -0.000083ms | -1.38% |
| max | 0.01ms | 0.01ms | -0.00046ms | -3.33% |
| total | 0.14ms | 0.15ms | -0.01ms | -7.60% |

### form_action_batch (5 invokeAction with FormData)

# Perf Report — form_action_batch (5 invokeAction with FormData).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.10ms |
| p50 | 0.12ms |
| p95 | 0.27ms |
| p99 | 0.30ms |
| mean | 0.14ms |
| stdev | 0.06ms |
| min | 0.10ms |
| max | 0.31ms |
| total | 2.82ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.10ms | 0.09ms | +0.0087ms | +9.35% |
| p50 | 0.12ms | 0.10ms | +0.01ms | +11.99% |
| p95 | 0.27ms | 0.25ms | +0.01ms | +4.17% |
| p99 | 0.30ms | 0.34ms | -0.04ms | -11.87% |
| mean | 0.14ms | 0.13ms | +0.01ms | +8.48% |
| min | 0.10ms | 0.09ms | +0.0099ms | +10.81% |
| max | 0.31ms | 0.36ms | -0.05ms | -14.69% |
| total | 2.82ms | 2.60ms | +0.22ms | +8.48% |

### load_error_handling (5 throw + catch)

# Perf Report — load_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0031ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.04ms | -0.03ms | -68.25% |
| p50 | 0.01ms | 0.04ms | -0.03ms | -63.85% |
| p95 | 0.02ms | 0.08ms | -0.06ms | -73.54% |
| p99 | 0.02ms | 0.12ms | -0.10ms | -80.94% |
| mean | 0.01ms | 0.05ms | -0.03ms | -68.97% |
| min | 0.01ms | 0.04ms | -0.03ms | -68.51% |
| max | 0.02ms | 0.13ms | -0.11ms | -82.05% |
| total | 0.30ms | 0.97ms | -0.67ms | -68.97% |

