# Perf Suite — workflow

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| executeWorkflow | 0.00058ms | 0.0025ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| defineWorkflow | 0.00017ms | 0.00029ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +160%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| retryStepSucceed | 0.00038ms | 0.00096ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| executeWorkflow | 0.02ms | 10ms | PASS |
| defineWorkflow | 0.01ms | 10ms | PASS |
| retryStepSucceed | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| executeWorkflow | 80600 B | 0 B | 102400 B | yes | PASS |
| defineWorkflow | -15136 B | 0 B | 102400 B | yes | PASS |
| retryStepSucceed | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### executeWorkflow

# Perf Report — executeWorkflow.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.00063ms |
| p95 | 0.0025ms |
| p99 | 0.0067ms |
| mean | 0.0010ms |
| stdev | 0.0016ms |
| min | 0.00054ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00058ms | 0.00058ms | 0.00ms | 0.00% |
| p50 | 0.00063ms | 0.00063ms | 0.00ms | 0.00% |
| p95 | 0.0025ms | 0.0025ms | +0.0000041ms | +0.17% |
| p99 | 0.0067ms | 0.0086ms | -0.0019ms | -22.09% |
| mean | 0.0010ms | 0.0011ms | -0.00010ms | -9.28% |
| min | 0.00054ms | 0.00054ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.0064ms | +53.87% |
| total | 0.20ms | 0.22ms | -0.02ms | -9.28% |

### defineWorkflow

# Perf Report — defineWorkflow.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.00029ms |
| p99 | 0.0041ms |
| mean | 0.00034ms |
| stdev | 0.00068ms |
| min | 0.00017ms |
| max | 0.0062ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00021ms | -0.000041ms | -19.71% |
| p50 | 0.00021ms | 0.00025ms | -0.000041ms | -16.40% |
| p95 | 0.00029ms | 0.00029ms | -9.5e-7ms | -0.33% |
| p99 | 0.0041ms | 0.0035ms | +0.00059ms | +16.69% |
| mean | 0.00034ms | 0.00032ms | +0.000014ms | +4.19% |
| min | 0.00017ms | 0.00021ms | -0.000042ms | -20.19% |
| max | 0.0062ms | 0.0059ms | +0.00033ms | +5.69% |
| total | 0.07ms | 0.06ms | +0.0027ms | +4.19% |

### retryStepSucceed

# Perf Report — retryStepSucceed.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00096ms |
| p99 | 0.0036ms |
| mean | 0.00053ms |
| stdev | 0.00054ms |
| min | 0.00038ms |
| max | 0.0054ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p50 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p95 | 0.00096ms | 0.0013ms | -0.00029ms | -23.49% |
| p99 | 0.0036ms | 0.0037ms | -0.00013ms | -3.39% |
| mean | 0.00053ms | 0.00056ms | -0.000030ms | -5.24% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.0054ms | 0.01ms | -0.0052ms | -49.22% |
| total | 0.11ms | 0.11ms | -0.0059ms | -5.24% |

