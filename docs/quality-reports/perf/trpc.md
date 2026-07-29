# Perf Suite — trpc

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeProcedure_query | 0.00054ms | 0.0021ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeProcedure_mutation | 0.00045ms | 0.00071ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| client_query | 0.00050ms | 0.00092ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeProcedure_query | 0.02ms | 10ms | PASS |
| invokeProcedure_mutation | 0.01ms | 10ms | PASS |
| client_query | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeProcedure_query | -24120 B | 0 B | 102400 B | yes | PASS |
| invokeProcedure_mutation | -16216 B | 0 B | 102400 B | yes | PASS |
| client_query | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeProcedure_query

# Perf Report — invokeProcedure_query.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00058ms |
| p95 | 0.0021ms |
| p99 | 0.0062ms |
| mean | 0.00089ms |
| stdev | 0.00089ms |
| min | 0.00050ms |
| max | 0.0066ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00050ms | +0.000041ms | +8.20% |
| p50 | 0.00058ms | 0.00058ms | +0.0000010ms | +0.17% |
| p95 | 0.0021ms | 0.0023ms | -0.00020ms | -8.73% |
| p99 | 0.0062ms | 0.0044ms | +0.0018ms | +40.38% |
| mean | 0.00089ms | 0.00081ms | +0.000082ms | +10.14% |
| min | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| max | 0.0066ms | 0.0065ms | +0.00017ms | +2.59% |
| total | 0.18ms | 0.16ms | +0.02ms | +10.14% |

### invokeProcedure_mutation

# Perf Report — invokeProcedure_mutation.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00045ms |
| p50 | 0.00046ms |
| p95 | 0.00071ms |
| p99 | 0.0036ms |
| mean | 0.00095ms |
| stdev | 0.0059ms |
| min | 0.00042ms |
| max | 0.08ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00045ms | 0.00042ms | +0.000037ms | +8.85% |
| p50 | 0.00046ms | 0.00046ms | +0.0000010ms | +0.22% |
| p95 | 0.00071ms | 0.00067ms | +0.000042ms | +6.30% |
| p99 | 0.0036ms | 0.0015ms | +0.0021ms | +145.71% |
| mean | 0.00095ms | 0.00051ms | +0.00044ms | +86.46% |
| min | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| max | 0.08ms | 0.0047ms | +0.08ms | +1667.54% |
| total | 0.19ms | 0.10ms | +0.09ms | +86.46% |

### client_query

# Perf Report — client_query.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.00092ms |
| p99 | 0.0056ms |
| mean | 0.00067ms |
| stdev | 0.00071ms |
| min | 0.00046ms |
| max | 0.0057ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p50 | 0.00054ms | 0.00054ms | 0.00ms | 0.00% |
| p95 | 0.00092ms | 0.00096ms | -0.000039ms | -4.07% |
| p99 | 0.0056ms | 0.0055ms | +0.00016ms | +2.89% |
| mean | 0.00067ms | 0.00067ms | -2.4e-7ms | -0.04% |
| min | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| max | 0.0057ms | 0.0070ms | -0.0012ms | -17.36% |
| total | 0.13ms | 0.13ms | -0.000047ms | -0.04% |

