# Perf Suite — workflow

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| executeWorkflow | 0.00058ms | 0.0021ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| defineWorkflow | 0.00021ms | 0.00030ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +160%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| retryStepSucceed | 0.00038ms | 0.00098ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| executeWorkflow | 0.02ms | 10ms | PASS |
| defineWorkflow | 0.01ms | 10ms | PASS |
| retryStepSucceed | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| executeWorkflow | 75312 B | 0 B | 102400 B | yes | PASS |
| defineWorkflow | -16464 B | 0 B | 102400 B | yes | PASS |
| retryStepSucceed | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### executeWorkflow

# Perf Report — executeWorkflow.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.00058ms |
| p95 | 0.0021ms |
| p99 | 0.0068ms |
| mean | 0.00094ms |
| stdev | 0.0015ms |
| min | 0.00054ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00058ms | 0.00058ms | -0.0000041ms | -0.70% |
| p50 | 0.00058ms | 0.00063ms | -0.000041ms | -6.56% |
| p95 | 0.0021ms | 0.0025ms | -0.00037ms | -14.81% |
| p99 | 0.0068ms | 0.0086ms | -0.0019ms | -21.56% |
| mean | 0.00094ms | 0.0011ms | -0.00017ms | -15.50% |
| min | 0.00054ms | 0.00054ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.0051ms | +43.30% |
| total | 0.19ms | 0.22ms | -0.03ms | -15.50% |

### defineWorkflow

# Perf Report — defineWorkflow.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00021ms |
| p95 | 0.00030ms |
| p99 | 0.0040ms |
| mean | 0.00032ms |
| stdev | 0.00058ms |
| min | 0.00017ms |
| max | 0.0053ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p50 | 0.00021ms | 0.00025ms | -0.000041ms | -16.40% |
| p95 | 0.00030ms | 0.00029ms | +0.0000041ms | +1.42% |
| p99 | 0.0040ms | 0.0035ms | +0.00046ms | +12.96% |
| mean | 0.00032ms | 0.00032ms | -0.0000046ms | -1.41% |
| min | 0.00017ms | 0.00021ms | -0.000042ms | -20.19% |
| max | 0.0053ms | 0.0059ms | -0.00062ms | -10.64% |
| total | 0.06ms | 0.06ms | -0.00091ms | -1.41% |

### retryStepSucceed

# Perf Report — retryStepSucceed.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00098ms |
| p99 | 0.0033ms |
| mean | 0.00053ms |
| stdev | 0.00057ms |
| min | 0.00033ms |
| max | 0.0063ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p50 | 0.00042ms | 0.00042ms | -0.0000010ms | -0.24% |
| p95 | 0.00098ms | 0.0013ms | -0.00027ms | -21.58% |
| p99 | 0.0033ms | 0.0037ms | -0.00037ms | -10.04% |
| mean | 0.00053ms | 0.00056ms | -0.000039ms | -6.87% |
| min | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| max | 0.0063ms | 0.01ms | -0.0044ms | -41.01% |
| total | 0.11ms | 0.11ms | -0.0078ms | -6.87% |

