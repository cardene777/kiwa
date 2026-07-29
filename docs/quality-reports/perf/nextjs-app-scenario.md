# Perf Suite — nextjs-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | 0.0043ms | 0.0071ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| form_submission_batch (5 invoke with FormData) | 0.0034ms | 0.0049ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| action_error_handling (5 throw + catch) | 0.02ms | 0.02ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | 0.04ms | 200ms | PASS |
| form_submission_batch (5 invoke with FormData) | 0.02ms | 200ms | PASS |
| action_error_handling (5 throw + catch) | 0.10ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | -8152 B | 0 B | 102400 B | yes | PASS |
| form_submission_batch (5 invoke with FormData) | 2840 B | 0 B | 102400 B | yes | PASS |
| action_error_handling (5 throw + catch) | 648 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### server_action_workflow (10 invokeServerAction)

# Perf Report — server_action_workflow (10 invokeServerAction).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0043ms |
| p50 | 0.0044ms |
| p95 | 0.0071ms |
| p99 | 0.01ms |
| mean | 0.0053ms |
| stdev | 0.0017ms |
| min | 0.0043ms |
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0043ms | 0.0045ms | -0.00025ms | -5.42% |
| p50 | 0.0044ms | 0.0062ms | -0.0018ms | -29.19% |
| p95 | 0.0071ms | 0.10ms | -0.09ms | -92.71% |
| p99 | 0.01ms | 0.26ms | -0.25ms | -95.88% |
| mean | 0.0053ms | 0.02ms | -0.02ms | -78.54% |
| min | 0.0043ms | 0.0044ms | -0.00013ms | -2.83% |
| max | 0.01ms | 0.30ms | -0.29ms | -96.14% |
| total | 0.11ms | 0.49ms | -0.39ms | -78.54% |

### form_submission_batch (5 invoke with FormData)

# Perf Report — form_submission_batch (5 invoke with FormData).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0034ms |
| p50 | 0.0035ms |
| p95 | 0.0049ms |
| p99 | 0.0066ms |
| mean | 0.0039ms |
| stdev | 0.00087ms |
| min | 0.0033ms |
| max | 0.0071ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0034ms | 0.0042ms | -0.00084ms | -19.90% |
| p50 | 0.0035ms | 0.0043ms | -0.00081ms | -18.75% |
| p95 | 0.0049ms | 0.0052ms | -0.00026ms | -5.09% |
| p99 | 0.0066ms | 0.0058ms | +0.00081ms | +13.95% |
| mean | 0.0039ms | 0.0045ms | -0.00057ms | -12.80% |
| min | 0.0033ms | 0.0042ms | -0.00087ms | -20.79% |
| max | 0.0071ms | 0.0060ms | +0.0011ms | +18.05% |
| total | 0.08ms | 0.09ms | -0.01ms | -12.80% |

### action_error_handling (5 throw + catch)

# Perf Report — action_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.00059ms |
| min | 0.02ms |
| max | 0.02ms |
| total | 0.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0018ms | -9.00% |
| p50 | 0.02ms | 0.02ms | -0.0021ms | -9.92% |
| p95 | 0.02ms | 0.02ms | -0.0030ms | -12.74% |
| p99 | 0.02ms | 0.03ms | -0.0044ms | -17.62% |
| mean | 0.02ms | 0.02ms | -0.0024ms | -11.20% |
| min | 0.02ms | 0.02ms | -0.0019ms | -9.44% |
| max | 0.02ms | 0.03ms | -0.0048ms | -18.73% |
| total | 0.38ms | 0.43ms | -0.05ms | -11.20% |

