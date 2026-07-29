# Perf Suite — trpc

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00042ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00083ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeProcedure_query | 0.00058ms | 0.0027ms | 5ms | 0.00083ms | PASS | stable (検知には +0.00083ms (baseline 比 +166%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| invokeProcedure_mutation | 0.00046ms | 0.00059ms | 5ms | 0.00083ms | PASS | stable (検知には +0.00083ms (baseline 比 +200%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| client_query | 0.00054ms | 0.0012ms | 5ms | 0.00083ms | PASS | stable (検知には +0.00083ms (baseline 比 +166%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeProcedure_query | 0.01ms | 10ms | PASS |
| invokeProcedure_mutation | 0.01ms | 10ms | PASS |
| client_query | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeProcedure_query | 1208 B | -46734 B | 102400 B | yes | PASS |
| invokeProcedure_mutation | 616 B | 0 B | 102400 B | yes | PASS |
| client_query | -13192 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeProcedure_query

# Perf Report — invokeProcedure_query.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.00067ms |
| p95 | 0.0027ms |
| p99 | 0.0037ms |
| mean | 0.00090ms |
| stdev | 0.00093ms |
| min | 0.00054ms |
| max | 0.0083ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00058ms | 0.00050ms | +0.000084ms | +16.78% |
| p50 | 0.00067ms | 0.00058ms | +0.000084ms | +14.41% |
| p95 | 0.0027ms | 0.0023ms | +0.00033ms | +14.21% |
| p99 | 0.0037ms | 0.0044ms | -0.00071ms | -16.08% |
| mean | 0.00090ms | 0.00081ms | +0.000096ms | +11.96% |
| min | 0.00054ms | 0.00050ms | +0.000041ms | +8.20% |
| max | 0.0083ms | 0.0065ms | +0.0018ms | +28.40% |
| total | 0.18ms | 0.16ms | +0.02ms | +11.96% |

### invokeProcedure_mutation

# Perf Report — invokeProcedure_mutation.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.00059ms |
| p99 | 0.0023ms |
| mean | 0.00054ms |
| stdev | 0.00035ms |
| min | 0.00042ms |
| max | 0.0037ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00042ms | +0.000041ms | +9.83% |
| p50 | 0.00050ms | 0.00046ms | +0.000042ms | +9.17% |
| p95 | 0.00059ms | 0.00067ms | -0.000081ms | -12.14% |
| p99 | 0.0023ms | 0.0015ms | +0.00089ms | +60.92% |
| mean | 0.00054ms | 0.00051ms | +0.000029ms | +5.60% |
| min | 0.00042ms | 0.00042ms | +0.0000010ms | +0.24% |
| max | 0.0037ms | 0.0047ms | -0.0010ms | -21.92% |
| total | 0.11ms | 0.10ms | +0.0057ms | +5.60% |

### client_query

# Perf Report — client_query.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00054ms |
| p95 | 0.0012ms |
| p99 | 0.0038ms |
| mean | 0.00070ms |
| stdev | 0.00073ms |
| min | 0.00050ms |
| max | 0.0083ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00050ms | +0.000041ms | +8.20% |
| p50 | 0.00054ms | 0.00054ms | 0.00ms | 0.00% |
| p95 | 0.0012ms | 0.00096ms | +0.00025ms | +26.53% |
| p99 | 0.0038ms | 0.0055ms | -0.0017ms | -31.15% |
| mean | 0.00070ms | 0.00067ms | +0.000032ms | +4.79% |
| min | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| max | 0.0083ms | 0.0070ms | +0.0013ms | +18.57% |
| total | 0.14ms | 0.13ms | +0.0064ms | +4.79% |

