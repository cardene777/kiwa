# Perf Suite — workflow

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| executeWorkflow | 0.00063ms | 0.0022ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| defineWorkflow | 0.00017ms | 0.00029ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +160%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| retryStepSucceed | 0.00038ms | 0.0012ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| executeWorkflow | 0.01ms | 10ms | PASS |
| defineWorkflow | 0.01ms | 10ms | PASS |
| retryStepSucceed | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| executeWorkflow | 81576 B | 0 B | 102400 B | yes | PASS |
| defineWorkflow | -520 B | 0 B | 102400 B | yes | PASS |
| retryStepSucceed | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### executeWorkflow

# Perf Report — executeWorkflow.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00063ms |
| p50 | 0.00067ms |
| p95 | 0.0022ms |
| p99 | 0.0062ms |
| mean | 0.00093ms |
| stdev | 0.0011ms |
| min | 0.00058ms |
| max | 0.010ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00063ms | 0.00058ms | +0.000042ms | +7.20% |
| p50 | 0.00067ms | 0.00063ms | +0.000041ms | +6.56% |
| p95 | 0.0022ms | 0.0025ms | -0.00029ms | -11.58% |
| p99 | 0.0062ms | 0.0086ms | -0.0024ms | -28.21% |
| mean | 0.00093ms | 0.0011ms | -0.00018ms | -15.81% |
| min | 0.00058ms | 0.00054ms | +0.000042ms | +7.76% |
| max | 0.010ms | 0.01ms | -0.0019ms | -15.84% |
| total | 0.19ms | 0.22ms | -0.04ms | -15.81% |

### defineWorkflow

# Perf Report — defineWorkflow.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.00029ms |
| p99 | 0.0037ms |
| mean | 0.00031ms |
| stdev | 0.00056ms |
| min | 0.00017ms |
| max | 0.0056ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00021ms | -0.000041ms | -19.71% |
| p50 | 0.00021ms | 0.00025ms | -0.000041ms | -16.40% |
| p95 | 0.00029ms | 0.00029ms | -0.0000010ms | -0.34% |
| p99 | 0.0037ms | 0.0035ms | +0.00017ms | +4.69% |
| mean | 0.00031ms | 0.00032ms | -0.000015ms | -4.76% |
| min | 0.00017ms | 0.00021ms | -0.000042ms | -20.19% |
| max | 0.0056ms | 0.0059ms | -0.00025ms | -4.26% |
| total | 0.06ms | 0.06ms | -0.0031ms | -4.76% |

### retryStepSucceed

# Perf Report — retryStepSucceed.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00038ms |
| p95 | 0.0012ms |
| p99 | 0.0042ms |
| mean | 0.00095ms |
| stdev | 0.0059ms |
| min | 0.00033ms |
| max | 0.08ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p50 | 0.00038ms | 0.00042ms | -0.000042ms | -10.07% |
| p95 | 0.0012ms | 0.0013ms | -0.000068ms | -5.47% |
| p99 | 0.0042ms | 0.0037ms | +0.00047ms | +12.64% |
| mean | 0.00095ms | 0.00056ms | +0.00038ms | +67.96% |
| min | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| max | 0.08ms | 0.01ms | +0.07ms | +681.22% |
| total | 0.19ms | 0.11ms | +0.08ms | +67.96% |

