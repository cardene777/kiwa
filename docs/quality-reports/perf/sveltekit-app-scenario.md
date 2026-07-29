# Perf Suite — sveltekit-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| load_workflow (10 invokeLoad) | 0.0057ms | 0.0084ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| form_action_batch (5 invokeAction with FormData) | 0.10ms | 0.19ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| load_error_handling (5 throw + catch) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| load_workflow (10 invokeLoad) | 0.04ms | 200ms | PASS |
| form_action_batch (5 invokeAction with FormData) | 0.70ms | 200ms | PASS |
| load_error_handling (5 throw + catch) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| load_workflow (10 invokeLoad) | 5640 B | 0 B | 102400 B | yes | PASS |
| form_action_batch (5 invokeAction with FormData) | 53536 B | 0 B | 102400 B | yes | PASS |
| load_error_handling (5 throw + catch) | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### load_workflow (10 invokeLoad)

# Perf Report — load_workflow (10 invokeLoad).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0057ms |
| p50 | 0.0058ms |
| p95 | 0.0084ms |
| p99 | 0.01ms |
| mean | 0.0065ms |
| stdev | 0.0017ms |
| min | 0.0057ms |
| max | 0.01ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0057ms | 0.0061ms | -0.00037ms | -6.12% |
| p50 | 0.0058ms | 0.0072ms | -0.0014ms | -19.07% |
| p95 | 0.0084ms | 0.0086ms | -0.00019ms | -2.26% |
| p99 | 0.01ms | 0.01ms | -0.00061ms | -4.75% |
| mean | 0.0065ms | 0.0073ms | -0.00080ms | -10.86% |
| min | 0.0057ms | 0.0060ms | -0.00033ms | -5.57% |
| max | 0.01ms | 0.01ms | -0.00071ms | -5.14% |
| total | 0.13ms | 0.15ms | -0.02ms | -10.86% |

### form_action_batch (5 invokeAction with FormData)

# Perf Report — form_action_batch (5 invokeAction with FormData).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.10ms |
| p50 | 0.11ms |
| p95 | 0.19ms |
| p99 | 0.20ms |
| mean | 0.13ms |
| stdev | 0.03ms |
| min | 0.10ms |
| max | 0.21ms |
| total | 2.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.10ms | 0.09ms | +0.01ms | +12.12% |
| p50 | 0.11ms | 0.10ms | +0.01ms | +9.70% |
| p95 | 0.19ms | 0.25ms | -0.07ms | -26.49% |
| p99 | 0.20ms | 0.34ms | -0.14ms | -40.56% |
| mean | 0.13ms | 0.13ms | -0.0044ms | -3.35% |
| min | 0.10ms | 0.09ms | +0.01ms | +11.95% |
| max | 0.21ms | 0.36ms | -0.16ms | -43.04% |
| total | 2.51ms | 2.60ms | -0.09ms | -3.35% |

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
| mean | 0.02ms |
| stdev | 0.0029ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.04ms | -0.03ms | -67.76% |
| p50 | 0.01ms | 0.04ms | -0.03ms | -64.76% |
| p95 | 0.02ms | 0.08ms | -0.06ms | -75.65% |
| p99 | 0.02ms | 0.12ms | -0.10ms | -81.35% |
| mean | 0.02ms | 0.05ms | -0.03ms | -68.88% |
| min | 0.01ms | 0.04ms | -0.03ms | -67.95% |
| max | 0.02ms | 0.13ms | -0.11ms | -82.21% |
| total | 0.30ms | 0.97ms | -0.66ms | -68.88% |

