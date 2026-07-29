# Perf Suite — nextjs

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeServerAction | 0.00066ms | 0.0026ms | 5ms | 0.00033ms | PASS | stable (差 0.00021ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| invokeMiddleware | 0.0046ms | 0.0062ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| renderServerComponent | 0.00038ms | 0.00084ms | 5ms | 0.00033ms | PASS | stable (p10 -10% (閾値未満)、 p95 +21% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeServerAction | 0.02ms | 10ms | PASS |
| invokeMiddleware | 0.15ms | 10ms | PASS |
| renderServerComponent | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeServerAction | -3704 B | 0 B | 102400 B | yes | PASS |
| invokeMiddleware | -12416 B | 0 B | 102400 B | yes | PASS |
| renderServerComponent | -15464 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeServerAction

# Perf Report — invokeServerAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00066ms |
| p50 | 0.00083ms |
| p95 | 0.0026ms |
| p99 | 0.0081ms |
| mean | 0.0013ms |
| stdev | 0.0020ms |
| min | 0.00063ms |
| max | 0.02ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00066ms | 0.00087ms | -0.00021ms | -24.00% |
| p50 | 0.00083ms | 0.00088ms | -0.000041ms | -4.74% |
| p95 | 0.0026ms | 0.0025ms | +0.00011ms | +4.33% |
| p99 | 0.0081ms | 0.0070ms | +0.0011ms | +16.01% |
| mean | 0.0013ms | 0.0013ms | +0.000029ms | +2.34% |
| min | 0.00063ms | 0.00083ms | -0.00021ms | -24.97% |
| max | 0.02ms | 0.02ms | +0.00079ms | +3.46% |
| total | 0.26ms | 0.25ms | +0.0059ms | +2.34% |

### invokeMiddleware

# Perf Report — invokeMiddleware.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0046ms |
| p50 | 0.0047ms |
| p95 | 0.0062ms |
| p99 | 0.02ms |
| mean | 0.0052ms |
| stdev | 0.0023ms |
| min | 0.0045ms |
| max | 0.02ms |
| total | 1.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0046ms | 0.0052ms | -0.00058ms | -11.30% |
| p50 | 0.0047ms | 0.0054ms | -0.00067ms | -12.41% |
| p95 | 0.0062ms | 0.0087ms | -0.0025ms | -28.71% |
| p99 | 0.02ms | 0.02ms | +0.0029ms | +17.46% |
| mean | 0.0052ms | 0.0059ms | -0.00070ms | -11.87% |
| min | 0.0045ms | 0.0051ms | -0.00062ms | -12.30% |
| max | 0.02ms | 0.02ms | -0.00075ms | -3.10% |
| total | 1.04ms | 1.19ms | -0.14ms | -11.87% |

### renderServerComponent

# Perf Report — renderServerComponent.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00084ms |
| p99 | 0.0036ms |
| mean | 0.00055ms |
| stdev | 0.00079ms |
| min | 0.00038ms |
| max | 0.0089ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00042ms | -0.000042ms | -10.07% |
| p50 | 0.00042ms | 0.00046ms | -0.000042ms | -9.15% |
| p95 | 0.00084ms | 0.00069ms | +0.00015ms | +21.05% |
| p99 | 0.0036ms | 0.0031ms | +0.00050ms | +15.93% |
| mean | 0.00055ms | 0.00061ms | -0.000065ms | -10.61% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.0089ms | 0.01ms | -0.0035ms | -28.20% |
| total | 0.11ms | 0.12ms | -0.01ms | -10.61% |

