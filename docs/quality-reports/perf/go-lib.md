# Perf Suite — go-lib

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeGinHandler | 0.00042ms | 0.0012ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeEchoHandler | 0.00038ms | 0.00088ms | 5ms | 0.00033ms | PASS | stable (p10 -18% (閾値未満)、 p95 +52% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| invokeFiberHandler | 0.00038ms | 0.0013ms | 5ms | 0.00033ms | PASS | stable (差 0.00013ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| captureChiRoute | 0.00067ms | 0.0015ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeGinHandler | 0.01ms | 10ms | PASS |
| invokeEchoHandler | 0.01ms | 10ms | PASS |
| invokeFiberHandler | 0.02ms | 10ms | PASS |
| captureChiRoute | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeGinHandler | -17488 B | 0 B | 102400 B | yes | PASS |
| invokeEchoHandler | -27168 B | 0 B | 102400 B | yes | PASS |
| invokeFiberHandler | -5384 B | 0 B | 102400 B | yes | PASS |
| captureChiRoute | -4160 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeGinHandler

# Perf Report — invokeGinHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.0012ms |
| p99 | 0.0047ms |
| mean | 0.00064ms |
| stdev | 0.00085ms |
| min | 0.00038ms |
| max | 0.0076ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p50 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p95 | 0.0012ms | 0.0014ms | -0.00022ms | -15.15% |
| p99 | 0.0047ms | 0.0053ms | -0.00066ms | -12.29% |
| mean | 0.00064ms | 0.00069ms | -0.000046ms | -6.64% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.0076ms | 0.0083ms | -0.00067ms | -8.04% |
| total | 0.13ms | 0.14ms | -0.0091ms | -6.64% |

### invokeEchoHandler

# Perf Report — invokeEchoHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00044ms |
| p95 | 0.00088ms |
| p99 | 0.0040ms |
| mean | 0.00058ms |
| stdev | 0.00080ms |
| min | 0.00033ms |
| max | 0.0089ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00046ms | -0.000083ms | -18.12% |
| p50 | 0.00044ms | 0.00046ms | -0.000021ms | -4.68% |
| p95 | 0.00088ms | 0.00058ms | +0.00030ms | +51.51% |
| p99 | 0.0040ms | 0.0043ms | -0.00029ms | -6.83% |
| mean | 0.00058ms | 0.00060ms | -0.000020ms | -3.35% |
| min | 0.00033ms | 0.00042ms | -0.000083ms | -19.95% |
| max | 0.0089ms | 0.0073ms | +0.0015ms | +21.03% |
| total | 0.12ms | 0.12ms | -0.0040ms | -3.35% |

### invokeFiberHandler

# Perf Report — invokeFiberHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00050ms |
| p95 | 0.0013ms |
| p99 | 0.01ms |
| mean | 0.00067ms |
| stdev | 0.0013ms |
| min | 0.00033ms |
| max | 0.01ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00050ms | -0.00013ms | -25.00% |
| p50 | 0.00050ms | 0.00054ms | -0.000041ms | -7.58% |
| p95 | 0.0013ms | 0.0010ms | +0.00033ms | +32.75% |
| p99 | 0.01ms | 0.0038ms | +0.0064ms | +167.84% |
| mean | 0.00067ms | 0.00070ms | -0.000030ms | -4.26% |
| min | 0.00033ms | 0.00050ms | -0.00017ms | -33.40% |
| max | 0.01ms | 0.01ms | -0.00046ms | -4.24% |
| total | 0.13ms | 0.14ms | -0.0060ms | -4.26% |

### captureChiRoute

# Perf Report — captureChiRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00067ms |
| p50 | 0.00071ms |
| p95 | 0.0015ms |
| p99 | 0.0079ms |
| mean | 0.0010ms |
| stdev | 0.0012ms |
| min | 0.00067ms |
| max | 0.01ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00067ms | 0.00083ms | -0.00017ms | -19.93% |
| p50 | 0.00071ms | 0.00083ms | -0.00013ms | -14.99% |
| p95 | 0.0015ms | 0.0014ms | +0.00013ms | +9.33% |
| p99 | 0.0079ms | 0.0054ms | +0.0025ms | +46.83% |
| mean | 0.0010ms | 0.0010ms | -0.000035ms | -3.39% |
| min | 0.00067ms | 0.00079ms | -0.00013ms | -15.80% |
| max | 0.01ms | 0.01ms | +0.00088ms | +8.02% |
| total | 0.20ms | 0.21ms | -0.0071ms | -3.39% |

