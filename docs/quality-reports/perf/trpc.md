# Perf Suite — trpc

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeProcedure_query | 0.00050ms | 0.0019ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeProcedure_mutation | 0.00042ms | 0.00063ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| client_query | 0.00050ms | 0.00088ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeProcedure_query | 0.01ms | 10ms | PASS |
| invokeProcedure_mutation | 0.02ms | 10ms | PASS |
| client_query | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeProcedure_query | -331512 B | 0 B | 102400 B | yes | PASS |
| invokeProcedure_mutation | -15040 B | 0 B | 102400 B | yes | PASS |
| client_query | 744 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeProcedure_query

# Perf Report — invokeProcedure_query.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00058ms |
| p95 | 0.0019ms |
| p99 | 0.0053ms |
| mean | 0.00084ms |
| stdev | 0.00076ms |
| min | 0.00046ms |
| max | 0.0056ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p50 | 0.00058ms | 0.00058ms | 0.00ms | 0.00% |
| p95 | 0.0019ms | 0.0023ms | -0.00041ms | -17.64% |
| p99 | 0.0053ms | 0.0044ms | +0.00083ms | +18.76% |
| mean | 0.00084ms | 0.00081ms | +0.000036ms | +4.45% |
| min | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| max | 0.0056ms | 0.0065ms | -0.00087ms | -13.55% |
| total | 0.17ms | 0.16ms | +0.0072ms | +4.45% |

### invokeProcedure_mutation

# Perf Report — invokeProcedure_mutation.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.00063ms |
| p99 | 0.0023ms |
| mean | 0.00052ms |
| stdev | 0.00040ms |
| min | 0.00042ms |
| max | 0.0047ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p50 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p95 | 0.00063ms | 0.00067ms | -0.000042ms | -6.30% |
| p99 | 0.0023ms | 0.0015ms | +0.00080ms | +55.08% |
| mean | 0.00052ms | 0.00051ms | +0.000015ms | +2.97% |
| min | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| max | 0.0047ms | 0.0047ms | -0.000042ms | -0.88% |
| total | 0.10ms | 0.10ms | +0.0030ms | +2.97% |

### client_query

# Perf Report — client_query.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.00088ms |
| p99 | 0.0057ms |
| mean | 0.00067ms |
| stdev | 0.00076ms |
| min | 0.00046ms |
| max | 0.0066ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p50 | 0.00054ms | 0.00054ms | -0.0000010ms | -0.18% |
| p95 | 0.00088ms | 0.00096ms | -0.000079ms | -8.23% |
| p99 | 0.0057ms | 0.0055ms | +0.00020ms | +3.73% |
| mean | 0.00067ms | 0.00067ms | +0.0000037ms | +0.56% |
| min | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| max | 0.0066ms | 0.0070ms | -0.00037ms | -5.39% |
| total | 0.13ms | 0.13ms | +0.00075ms | +0.56% |

