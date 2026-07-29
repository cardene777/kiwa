# Perf Suite — nextjs-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | 0.0045ms | 0.0078ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| form_submission_batch (5 invoke with FormData) | 0.0041ms | 0.0048ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| action_error_handling (5 throw + catch) | 0.02ms | 0.03ms | 100ms | 0.00049ms | PASS | stable (p10 -11% (閾値未満)、 p95 +20% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | 0.03ms | 200ms | PASS |
| form_submission_batch (5 invoke with FormData) | 0.03ms | 200ms | PASS |
| action_error_handling (5 throw + catch) | 0.10ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | -131648 B | 0 B | 102400 B | yes | PASS |
| form_submission_batch (5 invoke with FormData) | 1992 B | 0 B | 102400 B | yes | PASS |
| action_error_handling (5 throw + catch) | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### server_action_workflow (10 invokeServerAction)

# Perf Report — server_action_workflow (10 invokeServerAction).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0045ms |
| p50 | 0.0052ms |
| p95 | 0.0078ms |
| p99 | 0.01ms |
| mean | 0.0057ms |
| stdev | 0.0018ms |
| min | 0.0044ms |
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0045ms | 0.0045ms | -0.000079ms | -1.74% |
| p50 | 0.0052ms | 0.0062ms | -0.0010ms | -16.78% |
| p95 | 0.0078ms | 0.10ms | -0.09ms | -92.08% |
| p99 | 0.01ms | 0.26ms | -0.25ms | -95.72% |
| mean | 0.0057ms | 0.02ms | -0.02ms | -76.65% |
| min | 0.0044ms | 0.0044ms | -0.0000010ms | -0.02% |
| max | 0.01ms | 0.30ms | -0.29ms | -96.02% |
| total | 0.11ms | 0.49ms | -0.38ms | -76.65% |

### form_submission_batch (5 invoke with FormData)

# Perf Report — form_submission_batch (5 invoke with FormData).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0041ms |
| p50 | 0.0041ms |
| p95 | 0.0048ms |
| p99 | 0.0050ms |
| mean | 0.0042ms |
| stdev | 0.00026ms |
| min | 0.0040ms |
| max | 0.0051ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0041ms | 0.0042ms | -0.000091ms | -2.17% |
| p50 | 0.0041ms | 0.0043ms | -0.00019ms | -4.33% |
| p95 | 0.0048ms | 0.0052ms | -0.00036ms | -7.01% |
| p99 | 0.0050ms | 0.0058ms | -0.00081ms | -13.82% |
| mean | 0.0042ms | 0.0045ms | -0.00022ms | -4.91% |
| min | 0.0040ms | 0.0042ms | -0.00021ms | -4.94% |
| max | 0.0051ms | 0.0060ms | -0.00092ms | -15.28% |
| total | 0.08ms | 0.09ms | -0.0044ms | -4.91% |

### action_error_handling (5 throw + catch)

# Perf Report — action_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0033ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0022ms | -10.65% |
| p50 | 0.02ms | 0.02ms | -0.0021ms | -9.92% |
| p95 | 0.03ms | 0.02ms | +0.0048ms | +20.38% |
| p99 | 0.03ms | 0.03ms | +0.0048ms | +19.16% |
| mean | 0.02ms | 0.02ms | -0.0016ms | -7.22% |
| min | 0.02ms | 0.02ms | -0.0022ms | -11.08% |
| max | 0.03ms | 0.03ms | +0.0048ms | +18.89% |
| total | 0.40ms | 0.43ms | -0.03ms | -7.22% |

