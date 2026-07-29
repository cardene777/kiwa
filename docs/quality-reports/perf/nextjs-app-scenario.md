# Perf Suite — nextjs-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | 0.0069ms | 0.0087ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| form_submission_batch (5 invoke with FormData) | 0.0042ms | 0.0052ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| action_error_handling (5 throw + catch) | 0.02ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | 0.04ms | 200ms | PASS |
| form_submission_batch (5 invoke with FormData) | 0.03ms | 200ms | PASS |
| action_error_handling (5 throw + catch) | 0.31ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | -5088 B | 0 B | 102400 B | yes | PASS |
| form_submission_batch (5 invoke with FormData) | 2840 B | 0 B | 102400 B | yes | PASS |
| action_error_handling (5 throw + catch) | 648 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### server_action_workflow (10 invokeServerAction)

# Perf Report — server_action_workflow (10 invokeServerAction).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0069ms |
| p50 | 0.0070ms |
| p95 | 0.0087ms |
| p99 | 0.01ms |
| mean | 0.0075ms |
| stdev | 0.0019ms |
| min | 0.0053ms |
| max | 0.02ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0069ms | 0.0045ms | +0.0023ms | +51.41% |
| p50 | 0.0070ms | 0.0062ms | +0.00081ms | +13.08% |
| p95 | 0.0087ms | 0.10ms | -0.09ms | -91.15% |
| p99 | 0.01ms | 0.26ms | -0.25ms | -94.66% |
| mean | 0.0075ms | 0.02ms | -0.02ms | -69.49% |
| min | 0.0053ms | 0.0044ms | +0.00087ms | +19.79% |
| max | 0.02ms | 0.30ms | -0.28ms | -94.95% |
| total | 0.15ms | 0.49ms | -0.34ms | -69.49% |

### form_submission_batch (5 invoke with FormData)

# Perf Report — form_submission_batch (5 invoke with FormData).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0042ms |
| p50 | 0.0042ms |
| p95 | 0.0052ms |
| p99 | 0.0065ms |
| mean | 0.0045ms |
| stdev | 0.00062ms |
| min | 0.0041ms |
| max | 0.0068ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0042ms | 0.0042ms | -0.000046ms | -1.10% |
| p50 | 0.0042ms | 0.0043ms | -0.00010ms | -2.39% |
| p95 | 0.0052ms | 0.0052ms | +0.000042ms | +0.81% |
| p99 | 0.0065ms | 0.0058ms | +0.00068ms | +11.58% |
| mean | 0.0045ms | 0.0045ms | +0.0000021ms | +0.05% |
| min | 0.0041ms | 0.0042ms | -0.000083ms | -1.97% |
| max | 0.0068ms | 0.0060ms | +0.00083ms | +13.90% |
| total | 0.09ms | 0.09ms | +0.000042ms | +0.05% |

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
| stdev | 0.00082ms |
| min | 0.02ms |
| max | 0.02ms |
| total | 0.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0016ms | -7.77% |
| p50 | 0.02ms | 0.02ms | -0.0020ms | -9.42% |
| p95 | 0.02ms | 0.02ms | -0.0023ms | -9.65% |
| p99 | 0.02ms | 0.03ms | -0.0035ms | -13.99% |
| mean | 0.02ms | 0.02ms | -0.0021ms | -9.77% |
| min | 0.02ms | 0.02ms | -0.0015ms | -7.59% |
| max | 0.02ms | 0.03ms | -0.0038ms | -14.99% |
| total | 0.39ms | 0.43ms | -0.04ms | -9.77% |

