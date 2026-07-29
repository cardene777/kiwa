# Perf Suite — trpc

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeProcedure_query | 0.00050ms | 0.0012ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeProcedure_mutation | 0.00042ms | 0.00063ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| client_query | 0.00050ms | 0.0010ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeProcedure_query | 0.01ms | 10ms | PASS |
| invokeProcedure_mutation | 0.01ms | 10ms | PASS |
| client_query | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeProcedure_query | -9960 B | 0 B | 102400 B | yes | PASS |
| invokeProcedure_mutation | -14984 B | 0 B | 102400 B | yes | PASS |
| client_query | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeProcedure_query

# Perf Report — invokeProcedure_query.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.0012ms |
| p99 | 0.0039ms |
| mean | 0.00068ms |
| stdev | 0.00062ms |
| min | 0.00046ms |
| max | 0.0063ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p50 | 0.00054ms | 0.00058ms | -0.000041ms | -7.03% |
| p95 | 0.0012ms | 0.0023ms | -0.0011ms | -47.91% |
| p99 | 0.0039ms | 0.0044ms | -0.00054ms | -12.24% |
| mean | 0.00068ms | 0.00081ms | -0.00012ms | -15.41% |
| min | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| max | 0.0063ms | 0.0065ms | -0.00013ms | -1.94% |
| total | 0.14ms | 0.16ms | -0.02ms | -15.41% |

### invokeProcedure_mutation

# Perf Report — invokeProcedure_mutation.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.00063ms |
| p99 | 0.0021ms |
| mean | 0.00051ms |
| stdev | 0.00035ms |
| min | 0.00042ms |
| max | 0.0040ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | -0.0000010ms | -0.24% |
| p50 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p95 | 0.00063ms | 0.00067ms | -0.000040ms | -5.98% |
| p99 | 0.0021ms | 0.0015ms | +0.00068ms | +46.33% |
| mean | 0.00051ms | 0.00051ms | +0.0000017ms | +0.34% |
| min | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| max | 0.0040ms | 0.0047ms | -0.00075ms | -15.79% |
| total | 0.10ms | 0.10ms | +0.00034ms | +0.34% |

### client_query

# Perf Report — client_query.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.0010ms |
| p99 | 0.0062ms |
| mean | 0.00068ms |
| stdev | 0.00082ms |
| min | 0.00046ms |
| max | 0.0069ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p50 | 0.00054ms | 0.00054ms | -0.0000010ms | -0.18% |
| p95 | 0.0010ms | 0.00096ms | +0.000084ms | +8.77% |
| p99 | 0.0062ms | 0.0055ms | +0.00070ms | +12.83% |
| mean | 0.00068ms | 0.00067ms | +0.000015ms | +2.24% |
| min | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| max | 0.0069ms | 0.0070ms | -0.000041ms | -0.59% |
| total | 0.14ms | 0.13ms | +0.0030ms | +2.24% |

