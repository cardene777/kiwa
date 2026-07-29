# Perf Suite — nextjs-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | 0.0043ms | 0.0074ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| form_submission_batch (5 invoke with FormData) | 0.0033ms | 0.0051ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| action_error_handling (5 throw + catch) | 0.02ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | 0.03ms | 200ms | PASS |
| form_submission_batch (5 invoke with FormData) | 0.02ms | 200ms | PASS |
| action_error_handling (5 throw + catch) | 0.09ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | -369768 B | 0 B | 102400 B | yes | PASS |
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
| p50 | 0.0045ms |
| p95 | 0.0074ms |
| p99 | 0.01ms |
| mean | 0.0055ms |
| stdev | 0.0021ms |
| min | 0.0043ms |
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0043ms | 0.0045ms | -0.00021ms | -4.60% |
| p50 | 0.0045ms | 0.0062ms | -0.0017ms | -27.85% |
| p95 | 0.0074ms | 0.10ms | -0.09ms | -92.41% |
| p99 | 0.01ms | 0.26ms | -0.25ms | -95.28% |
| mean | 0.0055ms | 0.02ms | -0.02ms | -77.59% |
| min | 0.0043ms | 0.0044ms | -0.00013ms | -2.83% |
| max | 0.01ms | 0.30ms | -0.29ms | -95.52% |
| total | 0.11ms | 0.49ms | -0.38ms | -77.59% |

### form_submission_batch (5 invoke with FormData)

# Perf Report — form_submission_batch (5 invoke with FormData).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0033ms |
| p50 | 0.0037ms |
| p95 | 0.0051ms |
| p99 | 0.0074ms |
| mean | 0.0040ms |
| stdev | 0.0011ms |
| min | 0.0032ms |
| max | 0.0080ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0033ms | 0.0042ms | -0.00088ms | -20.89% |
| p50 | 0.0037ms | 0.0043ms | -0.00064ms | -14.89% |
| p95 | 0.0051ms | 0.0052ms | -0.000098ms | -1.89% |
| p99 | 0.0074ms | 0.0058ms | +0.0016ms | +27.09% |
| mean | 0.0040ms | 0.0045ms | -0.00049ms | -10.92% |
| min | 0.0032ms | 0.0042ms | -0.00096ms | -22.77% |
| max | 0.0080ms | 0.0060ms | +0.0020ms | +33.33% |
| total | 0.08ms | 0.09ms | -0.0097ms | -10.92% |

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
| stdev | 0.00057ms |
| min | 0.02ms |
| max | 0.02ms |
| total | 0.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0020ms | -9.59% |
| p50 | 0.02ms | 0.02ms | -0.0022ms | -10.41% |
| p95 | 0.02ms | 0.02ms | -0.0032ms | -13.52% |
| p99 | 0.02ms | 0.03ms | -0.0049ms | -19.36% |
| mean | 0.02ms | 0.02ms | -0.0025ms | -11.71% |
| min | 0.02ms | 0.02ms | -0.0019ms | -9.44% |
| max | 0.02ms | 0.03ms | -0.0053ms | -20.69% |
| total | 0.38ms | 0.43ms | -0.05ms | -11.71% |

