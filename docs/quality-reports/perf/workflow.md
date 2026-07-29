# Perf Suite — workflow

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| executeWorkflow | 0.00063ms | 0.0029ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| defineWorkflow | 0.00025ms | 0.00029ms | 5ms | 0.00033ms | PASS | stable (差 0.000042ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| retryStepSucceed | 0.00042ms | 0.0012ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| executeWorkflow | 0.02ms | 10ms | PASS |
| defineWorkflow | 0.01ms | 10ms | PASS |
| retryStepSucceed | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| executeWorkflow | 75360 B | 0 B | 102400 B | yes | PASS |
| defineWorkflow | -14928 B | 0 B | 102400 B | yes | PASS |
| retryStepSucceed | 11616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### executeWorkflow

# Perf Report — executeWorkflow.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00063ms |
| p50 | 0.00083ms |
| p95 | 0.0029ms |
| p99 | 0.0094ms |
| mean | 0.0013ms |
| stdev | 0.0018ms |
| min | 0.00058ms |
| max | 0.02ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00063ms | 0.00058ms | +0.000042ms | +7.20% |
| p50 | 0.00083ms | 0.00063ms | +0.00021ms | +33.44% |
| p95 | 0.0029ms | 0.0025ms | +0.00041ms | +16.53% |
| p99 | 0.0094ms | 0.0086ms | +0.00075ms | +8.68% |
| mean | 0.0013ms | 0.0011ms | +0.00021ms | +18.54% |
| min | 0.00058ms | 0.00054ms | +0.000042ms | +7.76% |
| max | 0.02ms | 0.01ms | +0.0055ms | +46.48% |
| total | 0.26ms | 0.22ms | +0.04ms | +18.54% |

### defineWorkflow

# Perf Report — defineWorkflow.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00025ms |
| p95 | 0.00029ms |
| p99 | 0.0046ms |
| mean | 0.00036ms |
| stdev | 0.00064ms |
| min | 0.00021ms |
| max | 0.0058ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00021ms | +0.000042ms | +20.19% |
| p50 | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| p95 | 0.00029ms | 0.00029ms | +0.0000020ms | +0.70% |
| p99 | 0.0046ms | 0.0035ms | +0.0011ms | +30.62% |
| mean | 0.00036ms | 0.00032ms | +0.000036ms | +11.18% |
| min | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| max | 0.0058ms | 0.0059ms | -0.000042ms | -0.71% |
| total | 0.07ms | 0.06ms | +0.0073ms | +11.18% |

### retryStepSucceed

# Perf Report — retryStepSucceed.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00042ms |
| p95 | 0.0012ms |
| p99 | 0.0038ms |
| mean | 0.00064ms |
| stdev | 0.0013ms |
| min | 0.00038ms |
| max | 0.02ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00038ms | +0.000041ms | +10.93% |
| p50 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p95 | 0.0012ms | 0.0013ms | -0.000081ms | -6.47% |
| p99 | 0.0038ms | 0.0037ms | +0.000046ms | +1.23% |
| mean | 0.00064ms | 0.00056ms | +0.000076ms | +13.43% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.0069ms | +64.44% |
| total | 0.13ms | 0.11ms | +0.02ms | +13.43% |

