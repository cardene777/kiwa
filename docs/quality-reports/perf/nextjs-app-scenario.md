# Perf Suite — nextjs-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | 0.0045ms | 0.0077ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| form_submission_batch (5 invoke with FormData) | 0.0040ms | 0.0060ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| action_error_handling (5 throw + catch) | 0.02ms | 0.02ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | 0.04ms | 200ms | PASS |
| form_submission_batch (5 invoke with FormData) | 0.03ms | 200ms | PASS |
| action_error_handling (5 throw + catch) | 0.10ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | 23616 B | 0 B | 102400 B | yes | PASS |
| form_submission_batch (5 invoke with FormData) | 2784 B | 0 B | 102400 B | yes | PASS |
| action_error_handling (5 throw + catch) | -376 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### server_action_workflow (10 invokeServerAction)

# Perf Report — server_action_workflow (10 invokeServerAction).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0045ms |
| p50 | 0.0056ms |
| p95 | 0.0077ms |
| p99 | 0.01ms |
| mean | 0.0059ms |
| stdev | 0.0019ms |
| min | 0.0044ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0045ms | 0.0045ms | -0.000080ms | -1.76% |
| p50 | 0.0056ms | 0.0062ms | -0.00065ms | -10.41% |
| p95 | 0.0077ms | 0.10ms | -0.09ms | -92.10% |
| p99 | 0.01ms | 0.26ms | -0.25ms | -95.59% |
| mean | 0.0059ms | 0.02ms | -0.02ms | -76.11% |
| min | 0.0044ms | 0.0044ms | -0.0000010ms | -0.02% |
| max | 0.01ms | 0.30ms | -0.29ms | -95.88% |
| total | 0.12ms | 0.49ms | -0.37ms | -76.11% |

### form_submission_batch (5 invoke with FormData)

# Perf Report — form_submission_batch (5 invoke with FormData).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0040ms |
| p50 | 0.0048ms |
| p95 | 0.0060ms |
| p99 | 0.0091ms |
| mean | 0.0049ms |
| stdev | 0.0013ms |
| min | 0.0040ms |
| max | 0.0098ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0040ms | 0.0042ms | -0.00017ms | -4.07% |
| p50 | 0.0048ms | 0.0043ms | +0.00046ms | +10.59% |
| p95 | 0.0060ms | 0.0052ms | +0.00083ms | +15.97% |
| p99 | 0.0091ms | 0.0058ms | +0.0032ms | +55.41% |
| mean | 0.0049ms | 0.0045ms | +0.00041ms | +9.29% |
| min | 0.0040ms | 0.0042ms | -0.00021ms | -4.94% |
| max | 0.0098ms | 0.0060ms | +0.0038ms | +63.90% |
| total | 0.10ms | 0.09ms | +0.0083ms | +9.29% |

### action_error_handling (5 throw + catch)

# Perf Report — action_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0028ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00054ms | -2.64% |
| p50 | 0.02ms | 0.02ms | -0.00083ms | -3.97% |
| p95 | 0.02ms | 0.02ms | -0.0011ms | -4.61% |
| p99 | 0.03ms | 0.03ms | +0.0054ms | +21.42% |
| mean | 0.02ms | 0.02ms | -0.00052ms | -2.42% |
| min | 0.02ms | 0.02ms | -0.00046ms | -2.26% |
| max | 0.03ms | 0.03ms | +0.0070ms | +27.36% |
| total | 0.42ms | 0.43ms | -0.01ms | -2.42% |

