# Perf Suite — workflow

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00042ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00083ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| executeWorkflow | 0.00063ms | 0.0047ms | 5ms | 0.00083ms | PASS | stable (検知には +0.00083ms (baseline 比 +143%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| defineWorkflow | 0.00021ms | 0.00033ms | 5ms | 0.00083ms | PASS | stable (検知には +0.00083ms (baseline 比 +401%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| retryStepSucceed | 0.00042ms | 0.0020ms | 5ms | 0.00083ms | PASS | stable (検知には +0.00083ms (baseline 比 +222%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| executeWorkflow | 0.02ms | 10ms | PASS |
| defineWorkflow | 0.04ms | 10ms | PASS |
| retryStepSucceed | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| executeWorkflow | 97760 B | 0 B | 102400 B | yes | PASS |
| defineWorkflow | -1784 B | 0 B | 102400 B | yes | PASS |
| retryStepSucceed | 1568 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### executeWorkflow

# Perf Report — executeWorkflow.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00063ms |
| p50 | 0.00071ms |
| p95 | 0.0047ms |
| p99 | 0.01ms |
| mean | 0.0018ms |
| stdev | 0.0076ms |
| min | 0.00063ms |
| max | 0.11ms |
| total | 0.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00063ms | 0.00058ms | +0.000042ms | +7.20% |
| p50 | 0.00071ms | 0.00063ms | +0.000083ms | +13.28% |
| p95 | 0.0047ms | 0.0025ms | +0.0021ms | +85.85% |
| p99 | 0.01ms | 0.0086ms | +0.0030ms | +35.28% |
| mean | 0.0018ms | 0.0011ms | +0.00070ms | +62.84% |
| min | 0.00063ms | 0.00054ms | +0.000084ms | +15.53% |
| max | 0.11ms | 0.01ms | +0.09ms | +789.39% |
| total | 0.36ms | 0.22ms | +0.14ms | +62.84% |

### defineWorkflow

# Perf Report — defineWorkflow.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00025ms |
| p95 | 0.00033ms |
| p99 | 0.0046ms |
| mean | 0.00035ms |
| stdev | 0.00066ms |
| min | 0.00021ms |
| max | 0.0063ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p50 | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| p95 | 0.00033ms | 0.00029ms | +0.000041ms | +14.06% |
| p99 | 0.0046ms | 0.0035ms | +0.0010ms | +28.29% |
| mean | 0.00035ms | 0.00032ms | +0.000021ms | +6.50% |
| min | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| max | 0.0063ms | 0.0059ms | +0.00038ms | +6.38% |
| total | 0.07ms | 0.06ms | +0.0042ms | +6.50% |

### retryStepSucceed

# Perf Report — retryStepSucceed.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.0020ms |
| p99 | 0.0056ms |
| mean | 0.0078ms |
| stdev | 0.10ms |
| min | 0.00038ms |
| max | 1.42ms |
| total | 1.56ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00038ms | +0.000041ms | +10.93% |
| p50 | 0.00046ms | 0.00042ms | +0.000041ms | +9.83% |
| p95 | 0.0020ms | 0.0013ms | +0.00071ms | +56.71% |
| p99 | 0.0056ms | 0.0037ms | +0.0018ms | +49.79% |
| mean | 0.0078ms | 0.00056ms | +0.0072ms | +1283.65% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 1.42ms | 0.01ms | +1.40ms | +13167.95% |
| total | 1.56ms | 0.11ms | +1.45ms | +1283.65% |

