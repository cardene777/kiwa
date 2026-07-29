# Perf Suite — nextjs-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | 0.0044ms | 0.0097ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| form_submission_batch (5 invoke with FormData) | 0.0040ms | 0.01ms | 100ms | 0.00049ms | PASS | stable (p10 -4% (閾値未満)、 p95 +100% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| action_error_handling (5 throw + catch) | 0.02ms | 0.03ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | 0.03ms | 200ms | PASS |
| form_submission_batch (5 invoke with FormData) | 0.03ms | 200ms | PASS |
| action_error_handling (5 throw + catch) | 0.10ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | -8456 B | 0 B | 102400 B | yes | PASS |
| form_submission_batch (5 invoke with FormData) | 904 B | 0 B | 102400 B | yes | PASS |
| action_error_handling (5 throw + catch) | -312 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### server_action_workflow (10 invokeServerAction)

# Perf Report — server_action_workflow (10 invokeServerAction).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0044ms |
| p50 | 0.0046ms |
| p95 | 0.0097ms |
| p99 | 0.01ms |
| mean | 0.0058ms |
| stdev | 0.0023ms |
| min | 0.0044ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0044ms | 0.0045ms | -0.00016ms | -3.59% |
| p50 | 0.0046ms | 0.0062ms | -0.0016ms | -26.18% |
| p95 | 0.0097ms | 0.10ms | -0.09ms | -90.10% |
| p99 | 0.01ms | 0.26ms | -0.25ms | -95.04% |
| mean | 0.0058ms | 0.02ms | -0.02ms | -76.49% |
| min | 0.0044ms | 0.0044ms | -0.000042ms | -0.95% |
| max | 0.01ms | 0.30ms | -0.29ms | -95.45% |
| total | 0.12ms | 0.49ms | -0.38ms | -76.49% |

### form_submission_batch (5 invoke with FormData)

# Perf Report — form_submission_batch (5 invoke with FormData).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0040ms |
| p50 | 0.0044ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0064ms |
| stdev | 0.0062ms |
| min | 0.0040ms |
| max | 0.03ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0040ms | 0.0042ms | -0.00017ms | -4.07% |
| p50 | 0.0044ms | 0.0043ms | +0.000084ms | +1.93% |
| p95 | 0.01ms | 0.0052ms | +0.0051ms | +99.56% |
| p99 | 0.03ms | 0.0058ms | +0.02ms | +375.90% |
| mean | 0.0064ms | 0.0045ms | +0.0019ms | +43.37% |
| min | 0.0040ms | 0.0042ms | -0.00021ms | -4.94% |
| max | 0.03ms | 0.0060ms | +0.03ms | +435.42% |
| total | 0.13ms | 0.09ms | +0.04ms | +43.37% |

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
| stdev | 0.0025ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0024ms | -11.86% |
| p50 | 0.02ms | 0.02ms | -0.0028ms | -13.49% |
| p95 | 0.03ms | 0.02ms | +0.0027ms | +11.67% |
| p99 | 0.03ms | 0.03ms | +0.0010ms | +4.15% |
| mean | 0.02ms | 0.02ms | -0.0023ms | -10.80% |
| min | 0.02ms | 0.02ms | -0.0024ms | -11.91% |
| max | 0.03ms | 0.03ms | +0.00062ms | +2.44% |
| total | 0.38ms | 0.43ms | -0.05ms | -10.80% |

