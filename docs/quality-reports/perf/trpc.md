# Perf Suite — trpc

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeProcedure_query | 0.00050ms | 0.0019ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeProcedure_mutation | 0.00046ms | 0.00067ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| client_query | 0.00050ms | 0.00088ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeProcedure_query | 0.01ms | 10ms | PASS |
| invokeProcedure_mutation | 0.01ms | 10ms | PASS |
| client_query | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeProcedure_query | -12088 B | 0 B | 102400 B | yes | PASS |
| invokeProcedure_mutation | -16416 B | 0 B | 102400 B | yes | PASS |
| client_query | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeProcedure_query

# Perf Report — invokeProcedure_query.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.0019ms |
| p99 | 0.0047ms |
| mean | 0.00081ms |
| stdev | 0.00085ms |
| min | 0.00046ms |
| max | 0.0074ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p50 | 0.00054ms | 0.00058ms | -0.000041ms | -7.03% |
| p95 | 0.0019ms | 0.0023ms | -0.00041ms | -17.68% |
| p99 | 0.0047ms | 0.0044ms | +0.00026ms | +5.97% |
| mean | 0.00081ms | 0.00081ms | +0.0000069ms | +0.86% |
| min | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| max | 0.0074ms | 0.0065ms | +0.00092ms | +14.20% |
| total | 0.16ms | 0.16ms | +0.0014ms | +0.86% |

### invokeProcedure_mutation

# Perf Report — invokeProcedure_mutation.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.00067ms |
| p99 | 0.0023ms |
| mean | 0.00055ms |
| stdev | 0.00037ms |
| min | 0.00038ms |
| max | 0.0040ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00042ms | +0.000041ms | +9.83% |
| p50 | 0.00050ms | 0.00046ms | +0.000042ms | +9.17% |
| p95 | 0.00067ms | 0.00067ms | +0.0000041ms | +0.62% |
| p99 | 0.0023ms | 0.0015ms | +0.00085ms | +57.94% |
| mean | 0.00055ms | 0.00051ms | +0.000043ms | +8.41% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.0040ms | 0.0047ms | -0.00079ms | -16.65% |
| total | 0.11ms | 0.10ms | +0.0086ms | +8.41% |

### client_query

# Perf Report — client_query.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.00088ms |
| p99 | 0.0056ms |
| mean | 0.00068ms |
| stdev | 0.00075ms |
| min | 0.00050ms |
| max | 0.0063ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p50 | 0.00054ms | 0.00054ms | 0.00ms | 0.00% |
| p95 | 0.00088ms | 0.00096ms | -0.000077ms | -8.01% |
| p99 | 0.0056ms | 0.0055ms | +0.00016ms | +3.01% |
| mean | 0.00068ms | 0.00067ms | +0.0000089ms | +1.33% |
| min | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| max | 0.0063ms | 0.0070ms | -0.00067ms | -9.57% |
| total | 0.14ms | 0.13ms | +0.0018ms | +1.33% |

