# Perf Suite — go-lib

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeGinHandler | 0.00042ms | 0.0034ms | 5ms | 0.00033ms | PASS | stable (p10 0% (閾値未満)、 p95 +135% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| invokeEchoHandler | 0.00046ms | 0.00063ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeFiberHandler | 0.00038ms | 0.0011ms | 5ms | 0.00033ms | PASS | stable (差 0.00013ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| captureChiRoute | 0.00071ms | 0.0014ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeGinHandler | 0.01ms | 10ms | PASS |
| invokeEchoHandler | 0.02ms | 10ms | PASS |
| invokeFiberHandler | 0.02ms | 10ms | PASS |
| captureChiRoute | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeGinHandler | -8856 B | 0 B | 102400 B | yes | PASS |
| invokeEchoHandler | -15856 B | 0 B | 102400 B | yes | PASS |
| invokeFiberHandler | 616 B | 0 B | 102400 B | yes | PASS |
| captureChiRoute | -4456 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeGinHandler

# Perf Report — invokeGinHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00054ms |
| p95 | 0.0034ms |
| p99 | 0.02ms |
| mean | 0.0017ms |
| stdev | 0.0048ms |
| min | 0.00038ms |
| max | 0.05ms |
| total | 0.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p50 | 0.00054ms | 0.00046ms | +0.000083ms | +18.12% |
| p95 | 0.0034ms | 0.0014ms | +0.0020ms | +134.77% |
| p99 | 0.02ms | 0.0053ms | +0.02ms | +333.74% |
| mean | 0.0017ms | 0.00069ms | +0.0010ms | +148.38% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.05ms | 0.0083ms | +0.04ms | +473.35% |
| total | 0.34ms | 0.14ms | +0.20ms | +148.38% |

### invokeEchoHandler

# Perf Report — invokeEchoHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.00063ms |
| p99 | 0.0038ms |
| mean | 0.00063ms |
| stdev | 0.00098ms |
| min | 0.00042ms |
| max | 0.01ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p50 | 0.00050ms | 0.00046ms | +0.000041ms | +8.93% |
| p95 | 0.00063ms | 0.00058ms | +0.000042ms | +7.19% |
| p99 | 0.0038ms | 0.0043ms | -0.00055ms | -12.75% |
| mean | 0.00063ms | 0.00060ms | +0.000026ms | +4.34% |
| min | 0.00042ms | 0.00042ms | +0.0000010ms | +0.24% |
| max | 0.01ms | 0.0073ms | +0.0032ms | +43.76% |
| total | 0.13ms | 0.12ms | +0.0052ms | +4.34% |

### invokeFiberHandler

# Perf Report — invokeFiberHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00050ms |
| p95 | 0.0011ms |
| p99 | 0.0096ms |
| mean | 0.00071ms |
| stdev | 0.0013ms |
| min | 0.00038ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00050ms | -0.00013ms | -25.00% |
| p50 | 0.00050ms | 0.00054ms | -0.000041ms | -7.58% |
| p95 | 0.0011ms | 0.0010ms | +0.00012ms | +12.37% |
| p99 | 0.0096ms | 0.0038ms | +0.0058ms | +151.82% |
| mean | 0.00071ms | 0.00070ms | +0.0000098ms | +1.39% |
| min | 0.00038ms | 0.00050ms | -0.00013ms | -25.00% |
| max | 0.01ms | 0.01ms | +0.0015ms | +13.51% |
| total | 0.14ms | 0.14ms | +0.0020ms | +1.39% |

### captureChiRoute

# Perf Report — captureChiRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00071ms |
| p50 | 0.00075ms |
| p95 | 0.0014ms |
| p99 | 0.0079ms |
| mean | 0.0010ms |
| stdev | 0.0012ms |
| min | 0.00071ms |
| max | 0.01ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00071ms | 0.00083ms | -0.00013ms | -15.01% |
| p50 | 0.00075ms | 0.00083ms | -0.000084ms | -10.07% |
| p95 | 0.0014ms | 0.0014ms | -5.0e-8ms | -0.00% |
| p99 | 0.0079ms | 0.0054ms | +0.0026ms | +47.62% |
| mean | 0.0010ms | 0.0010ms | -0.000023ms | -2.18% |
| min | 0.00071ms | 0.00079ms | -0.000083ms | -10.49% |
| max | 0.01ms | 0.01ms | +0.00075ms | +6.86% |
| total | 0.20ms | 0.21ms | -0.0045ms | -2.18% |

