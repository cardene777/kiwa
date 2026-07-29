# Perf Suite — nextjs-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | 0.0045ms | 0.0086ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| form_submission_batch (5 invoke with FormData) | 0.0034ms | 0.0054ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| action_error_handling (5 throw + catch) | 0.02ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | 0.03ms | 200ms | PASS |
| form_submission_batch (5 invoke with FormData) | 0.02ms | 200ms | PASS |
| action_error_handling (5 throw + catch) | 0.11ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | -170152 B | 0 B | 102400 B | yes | PASS |
| form_submission_batch (5 invoke with FormData) | 744 B | 0 B | 102400 B | yes | PASS |
| action_error_handling (5 throw + catch) | 280 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### server_action_workflow (10 invokeServerAction)

# Perf Report — server_action_workflow (10 invokeServerAction).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0045ms |
| p50 | 0.0061ms |
| p95 | 0.0086ms |
| p99 | 0.01ms |
| mean | 0.0065ms |
| stdev | 0.0021ms |
| min | 0.0044ms |
| max | 0.01ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0045ms | 0.0045ms | -0.000084ms | -1.85% |
| p50 | 0.0061ms | 0.0062ms | -0.000063ms | -1.01% |
| p95 | 0.0086ms | 0.10ms | -0.09ms | -91.24% |
| p99 | 0.01ms | 0.26ms | -0.25ms | -94.98% |
| mean | 0.0065ms | 0.02ms | -0.02ms | -73.60% |
| min | 0.0044ms | 0.0044ms | -0.000042ms | -0.95% |
| max | 0.01ms | 0.30ms | -0.29ms | -95.28% |
| total | 0.13ms | 0.49ms | -0.36ms | -73.60% |

### form_submission_batch (5 invoke with FormData)

# Perf Report — form_submission_batch (5 invoke with FormData).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0034ms |
| p50 | 0.0041ms |
| p95 | 0.0054ms |
| p99 | 0.0069ms |
| mean | 0.0042ms |
| stdev | 0.00089ms |
| min | 0.0034ms |
| max | 0.0073ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0034ms | 0.0042ms | -0.00083ms | -19.80% |
| p50 | 0.0041ms | 0.0043ms | -0.00023ms | -5.27% |
| p95 | 0.0054ms | 0.0052ms | +0.00026ms | +5.03% |
| p99 | 0.0069ms | 0.0058ms | +0.0011ms | +18.03% |
| mean | 0.0042ms | 0.0045ms | -0.00028ms | -6.26% |
| min | 0.0034ms | 0.0042ms | -0.00083ms | -19.80% |
| max | 0.0073ms | 0.0060ms | +0.0013ms | +20.83% |
| total | 0.08ms | 0.09ms | -0.0056ms | -6.26% |

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
| stdev | 0.0020ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0022ms | -10.82% |
| p50 | 0.02ms | 0.02ms | -0.0025ms | -11.91% |
| p95 | 0.02ms | 0.02ms | -0.0026ms | -11.17% |
| p99 | 0.03ms | 0.03ms | +0.00088ms | +3.49% |
| mean | 0.02ms | 0.02ms | -0.0024ms | -11.34% |
| min | 0.02ms | 0.02ms | -0.0022ms | -10.67% |
| max | 0.03ms | 0.03ms | +0.0017ms | +6.84% |
| total | 0.38ms | 0.43ms | -0.05ms | -11.34% |

