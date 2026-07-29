# Perf Suite — sveltekit-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| load_workflow (10 invokeLoad) | 0.0058ms | 0.0087ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| form_action_batch (5 invokeAction with FormData) | 0.10ms | 0.20ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| load_error_handling (5 throw + catch) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| load_workflow (10 invokeLoad) | 0.04ms | 200ms | PASS |
| form_action_batch (5 invokeAction with FormData) | 0.78ms | 200ms | PASS |
| load_error_handling (5 throw + catch) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| load_workflow (10 invokeLoad) | -515560 B | 0 B | 102400 B | yes | PASS |
| form_action_batch (5 invokeAction with FormData) | 4264 B | 0 B | 102400 B | yes | PASS |
| load_error_handling (5 throw + catch) | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### load_workflow (10 invokeLoad)

# Perf Report — load_workflow (10 invokeLoad).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0058ms |
| p50 | 0.0065ms |
| p95 | 0.0087ms |
| p99 | 0.01ms |
| mean | 0.0070ms |
| stdev | 0.0017ms |
| min | 0.0057ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0058ms | 0.0061ms | -0.00029ms | -4.73% |
| p50 | 0.0065ms | 0.0072ms | -0.00075ms | -10.41% |
| p95 | 0.0087ms | 0.0086ms | +0.000054ms | +0.63% |
| p99 | 0.01ms | 0.01ms | -0.00039ms | -3.06% |
| mean | 0.0070ms | 0.0073ms | -0.00035ms | -4.82% |
| min | 0.0057ms | 0.0060ms | -0.00029ms | -4.87% |
| max | 0.01ms | 0.01ms | -0.00050ms | -3.63% |
| total | 0.14ms | 0.15ms | -0.0071ms | -4.82% |

### form_action_batch (5 invokeAction with FormData)

# Perf Report — form_action_batch (5 invokeAction with FormData).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.10ms |
| p50 | 0.12ms |
| p95 | 0.20ms |
| p99 | 0.27ms |
| mean | 0.13ms |
| stdev | 0.04ms |
| min | 0.10ms |
| max | 0.29ms |
| total | 2.56ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.10ms | 0.09ms | +0.0077ms | +8.25% |
| p50 | 0.12ms | 0.10ms | +0.01ms | +11.73% |
| p95 | 0.20ms | 0.25ms | -0.05ms | -20.42% |
| p99 | 0.27ms | 0.34ms | -0.07ms | -19.49% |
| mean | 0.13ms | 0.13ms | -0.0022ms | -1.66% |
| min | 0.10ms | 0.09ms | +0.0075ms | +8.17% |
| max | 0.29ms | 0.36ms | -0.07ms | -19.32% |
| total | 2.56ms | 2.60ms | -0.04ms | -1.66% |

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
| stdev | 0.0046ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.04ms | -0.02ms | -66.98% |
| p50 | 0.02ms | 0.04ms | -0.02ms | -58.18% |
| p95 | 0.02ms | 0.08ms | -0.06ms | -72.08% |
| p99 | 0.03ms | 0.12ms | -0.09ms | -75.78% |
| mean | 0.02ms | 0.05ms | -0.03ms | -64.71% |
| min | 0.01ms | 0.04ms | -0.02ms | -66.93% |
| max | 0.03ms | 0.13ms | -0.10ms | -76.34% |
| total | 0.34ms | 0.97ms | -0.62ms | -64.71% |

