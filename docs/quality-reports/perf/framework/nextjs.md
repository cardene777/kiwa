# Perf Suite — nextjs

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeServerAction | 0.00063ms | 0.0019ms | 5ms | 0.00033ms | PASS | stable (差 0.00025ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| invokeMiddleware | 0.0044ms | 0.0061ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| renderServerComponent | 0.00038ms | 0.00063ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeServerAction | 0.02ms | 10ms | PASS |
| invokeMiddleware | 0.07ms | 10ms | PASS |
| renderServerComponent | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeServerAction | -264072 B | 0 B | 102400 B | yes | PASS |
| invokeMiddleware | -28368 B | 0 B | 102400 B | yes | PASS |
| renderServerComponent | 600 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeServerAction

# Perf Report — invokeServerAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00063ms |
| p50 | 0.00067ms |
| p95 | 0.0019ms |
| p99 | 0.0081ms |
| mean | 0.0011ms |
| stdev | 0.0018ms |
| min | 0.00058ms |
| max | 0.02ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00063ms | 0.00087ms | -0.00025ms | -28.24% |
| p50 | 0.00067ms | 0.00088ms | -0.00021ms | -23.77% |
| p95 | 0.0019ms | 0.0025ms | -0.00056ms | -22.62% |
| p99 | 0.0081ms | 0.0070ms | +0.0011ms | +15.99% |
| mean | 0.0011ms | 0.0013ms | -0.00017ms | -13.28% |
| min | 0.00058ms | 0.00083ms | -0.00025ms | -30.01% |
| max | 0.02ms | 0.02ms | -0.0030ms | -13.29% |
| total | 0.22ms | 0.25ms | -0.03ms | -13.28% |

### invokeMiddleware

# Perf Report — invokeMiddleware.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0044ms |
| p50 | 0.0045ms |
| p95 | 0.0061ms |
| p99 | 0.02ms |
| mean | 0.0050ms |
| stdev | 0.0021ms |
| min | 0.0043ms |
| max | 0.02ms |
| total | 0.99ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0044ms | 0.0052ms | -0.00075ms | -14.53% |
| p50 | 0.0045ms | 0.0054ms | -0.00087ms | -16.28% |
| p95 | 0.0061ms | 0.0087ms | -0.0025ms | -29.30% |
| p99 | 0.02ms | 0.02ms | -0.00063ms | -3.80% |
| mean | 0.0050ms | 0.0059ms | -0.00098ms | -16.49% |
| min | 0.0043ms | 0.0051ms | -0.00075ms | -14.76% |
| max | 0.02ms | 0.02ms | -0.0015ms | -6.38% |
| total | 0.99ms | 1.19ms | -0.20ms | -16.49% |

### renderServerComponent

# Perf Report — renderServerComponent.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00063ms |
| p99 | 0.0033ms |
| mean | 0.00053ms |
| stdev | 0.00064ms |
| min | 0.00038ms |
| max | 0.0061ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00042ms | -0.000042ms | -10.07% |
| p50 | 0.00042ms | 0.00046ms | -0.000042ms | -9.15% |
| p95 | 0.00063ms | 0.00069ms | -0.000061ms | -8.81% |
| p99 | 0.0033ms | 0.0031ms | +0.00021ms | +6.60% |
| mean | 0.00053ms | 0.00061ms | -0.000083ms | -13.52% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.0061ms | 0.01ms | -0.0063ms | -50.67% |
| total | 0.11ms | 0.12ms | -0.02ms | -13.52% |

