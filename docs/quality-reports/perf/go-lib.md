# Perf Suite — go-lib

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeGinHandler | 0.00042ms | 0.0021ms | 5ms | 0.00033ms | PASS | stable (p10 +0% (閾値未満)、 p95 +42% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| invokeEchoHandler | 0.00046ms | 0.00063ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeFiberHandler | 0.00038ms | 0.0010ms | 5ms | 0.00033ms | PASS | stable (差 0.00013ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| captureChiRoute | 0.00075ms | 0.0021ms | 5ms | 0.00033ms | PASS | stable (p10 -10% (閾値未満)、 p95 +48% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeGinHandler | 0.01ms | 10ms | PASS |
| invokeEchoHandler | 0.01ms | 10ms | PASS |
| invokeFiberHandler | 0.01ms | 10ms | PASS |
| captureChiRoute | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeGinHandler | -13544 B | 0 B | 102400 B | yes | PASS |
| invokeEchoHandler | -27600 B | 0 B | 102400 B | yes | PASS |
| invokeFiberHandler | -5240 B | 0 B | 102400 B | yes | PASS |
| captureChiRoute | 6776 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeGinHandler

# Perf Report — invokeGinHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.0021ms |
| p99 | 0.0066ms |
| mean | 0.00069ms |
| stdev | 0.00095ms |
| min | 0.00042ms |
| max | 0.0080ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | +0.0000010ms | +0.24% |
| p50 | 0.00046ms | 0.00046ms | +0.0000010ms | +0.22% |
| p95 | 0.0021ms | 0.0014ms | +0.00060ms | +41.72% |
| p99 | 0.0066ms | 0.0053ms | +0.0013ms | +24.37% |
| mean | 0.00069ms | 0.00069ms | -2.5e-8ms | -0.00% |
| min | 0.00042ms | 0.00038ms | +0.000041ms | +10.93% |
| max | 0.0080ms | 0.0083ms | -0.00029ms | -3.52% |
| total | 0.14ms | 0.14ms | -0.0000050ms | -0.00% |

### invokeEchoHandler

# Perf Report — invokeEchoHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00046ms |
| p95 | 0.00063ms |
| p99 | 0.0038ms |
| mean | 0.00060ms |
| stdev | 0.00075ms |
| min | 0.00042ms |
| max | 0.0075ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p50 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p95 | 0.00063ms | 0.00058ms | +0.000044ms | +7.56% |
| p99 | 0.0038ms | 0.0043ms | -0.00049ms | -11.35% |
| mean | 0.00060ms | 0.00060ms | -0.0000023ms | -0.38% |
| min | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| max | 0.0075ms | 0.0073ms | +0.00017ms | +2.28% |
| total | 0.12ms | 0.12ms | -0.00046ms | -0.38% |

### invokeFiberHandler

# Perf Report — invokeFiberHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00050ms |
| p95 | 0.0010ms |
| p99 | 0.0085ms |
| mean | 0.00071ms |
| stdev | 0.0013ms |
| min | 0.00033ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00050ms | -0.00013ms | -25.00% |
| p50 | 0.00050ms | 0.00054ms | -0.000041ms | -7.58% |
| p95 | 0.0010ms | 0.0010ms | +5.0e-8ms | +0.00% |
| p99 | 0.0085ms | 0.0038ms | +0.0047ms | +122.50% |
| mean | 0.00071ms | 0.00070ms | +0.0000044ms | +0.62% |
| min | 0.00033ms | 0.00050ms | -0.00017ms | -33.40% |
| max | 0.01ms | 0.01ms | +0.0012ms | +10.80% |
| total | 0.14ms | 0.14ms | +0.00088ms | +0.62% |

### captureChiRoute

# Perf Report — captureChiRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00075ms |
| p50 | 0.00088ms |
| p95 | 0.0021ms |
| p99 | 0.01ms |
| mean | 0.0018ms |
| stdev | 0.0086ms |
| min | 0.00067ms |
| max | 0.12ms |
| total | 0.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00075ms | 0.00083ms | -0.000083ms | -9.96% |
| p50 | 0.00088ms | 0.00083ms | +0.000041ms | +4.92% |
| p95 | 0.0021ms | 0.0014ms | +0.00069ms | +48.47% |
| p99 | 0.01ms | 0.0054ms | +0.0052ms | +96.04% |
| mean | 0.0018ms | 0.0010ms | +0.00072ms | +68.70% |
| min | 0.00067ms | 0.00079ms | -0.00012ms | -15.68% |
| max | 0.12ms | 0.01ms | +0.11ms | +1014.46% |
| total | 0.35ms | 0.21ms | +0.14ms | +68.70% |

