# Perf Suite — go-lib

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeGinHandler | 0.00054ms | 0.00084ms | 5ms | 0.00033ms | PASS | stable (差 0.00013ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| invokeEchoHandler | 0.00046ms | 0.00063ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeFiberHandler | 0.00054ms | 0.00084ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureChiRoute | 0.00075ms | 0.0015ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeGinHandler | 0.02ms | 10ms | PASS |
| invokeEchoHandler | 0.01ms | 10ms | PASS |
| invokeFiberHandler | 0.01ms | 10ms | PASS |
| captureChiRoute | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeGinHandler | -6432 B | -61301 B | 102400 B | yes | PASS |
| invokeEchoHandler | -152 B | 0 B | 102400 B | yes | PASS |
| invokeFiberHandler | 9384 B | 0 B | 102400 B | yes | PASS |
| captureChiRoute | -4344 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeGinHandler

# Perf Report — invokeGinHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00054ms |
| p95 | 0.00084ms |
| p99 | 0.0040ms |
| mean | 0.00069ms |
| stdev | 0.00072ms |
| min | 0.00050ms |
| max | 0.0085ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00042ms | +0.00013ms | +30.05% |
| p50 | 0.00054ms | 0.00046ms | +0.000084ms | +18.34% |
| p95 | 0.00084ms | 0.0014ms | -0.00061ms | -42.20% |
| p99 | 0.0040ms | 0.0053ms | -0.0014ms | -25.69% |
| mean | 0.00069ms | 0.00069ms | -1.0e-8ms | -0.00% |
| min | 0.00050ms | 0.00038ms | +0.00013ms | +33.33% |
| max | 0.0085ms | 0.0083ms | +0.00021ms | +2.51% |
| total | 0.14ms | 0.14ms | -0.0000020ms | -0.00% |

### invokeEchoHandler

# Perf Report — invokeEchoHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.00063ms |
| p99 | 0.0042ms |
| mean | 0.00063ms |
| stdev | 0.00088ms |
| min | 0.00042ms |
| max | 0.0094ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p50 | 0.00050ms | 0.00046ms | +0.000041ms | +8.93% |
| p95 | 0.00063ms | 0.00058ms | +0.000044ms | +7.56% |
| p99 | 0.0042ms | 0.0043ms | -0.000069ms | -1.60% |
| mean | 0.00063ms | 0.00060ms | +0.000028ms | +4.62% |
| min | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| max | 0.0094ms | 0.0073ms | +0.0021ms | +28.41% |
| total | 0.13ms | 0.12ms | +0.0056ms | +4.62% |

### invokeFiberHandler

# Perf Report — invokeFiberHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00058ms |
| p95 | 0.00084ms |
| p99 | 0.01ms |
| mean | 0.00086ms |
| stdev | 0.0017ms |
| min | 0.00054ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00050ms | +0.000042ms | +8.40% |
| p50 | 0.00058ms | 0.00054ms | +0.000043ms | +7.95% |
| p95 | 0.00084ms | 0.0010ms | -0.00017ms | -16.52% |
| p99 | 0.01ms | 0.0038ms | +0.0085ms | +224.04% |
| mean | 0.00086ms | 0.00070ms | +0.00015ms | +21.41% |
| min | 0.00054ms | 0.00050ms | +0.000041ms | +8.20% |
| max | 0.02ms | 0.01ms | +0.0054ms | +49.80% |
| total | 0.17ms | 0.14ms | +0.03ms | +21.41% |

### captureChiRoute

# Perf Report — captureChiRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00075ms |
| p50 | 0.00088ms |
| p95 | 0.0015ms |
| p99 | 0.0093ms |
| mean | 0.0011ms |
| stdev | 0.0016ms |
| min | 0.00071ms |
| max | 0.02ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00075ms | 0.00083ms | -0.000083ms | -9.96% |
| p50 | 0.00088ms | 0.00083ms | +0.000041ms | +4.92% |
| p95 | 0.0015ms | 0.0014ms | +0.000088ms | +6.22% |
| p99 | 0.0093ms | 0.0054ms | +0.0039ms | +72.74% |
| mean | 0.0011ms | 0.0010ms | +0.00010ms | +9.97% |
| min | 0.00071ms | 0.00079ms | -0.000083ms | -10.49% |
| max | 0.02ms | 0.01ms | +0.0056ms | +51.14% |
| total | 0.23ms | 0.21ms | +0.02ms | +9.97% |

