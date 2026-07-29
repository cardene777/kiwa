# Perf Suite — go-lib

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeGinHandler | 0.00042ms | 0.0015ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeEchoHandler | 0.00038ms | 0.0010ms | 5ms | 0.00033ms | PASS | stable (p10 -18% (閾値未満)、 p95 +72% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| invokeFiberHandler | 0.00054ms | 0.00075ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureChiRoute | 0.00071ms | 0.0015ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

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
| invokeGinHandler | -9168 B | 0 B | 102400 B | yes | PASS |
| invokeEchoHandler | -26720 B | 0 B | 102400 B | yes | PASS |
| invokeFiberHandler | 7680 B | 0 B | 102400 B | yes | PASS |
| captureChiRoute | 4304 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeGinHandler

# Perf Report — invokeGinHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.0015ms |
| p99 | 0.0059ms |
| mean | 0.00067ms |
| stdev | 0.00093ms |
| min | 0.00038ms |
| max | 0.0090ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p50 | 0.00046ms | 0.00046ms | +0.0000010ms | +0.22% |
| p95 | 0.0015ms | 0.0014ms | +0.0000098ms | +0.68% |
| p99 | 0.0059ms | 0.0053ms | +0.00055ms | +10.29% |
| mean | 0.00067ms | 0.00069ms | -0.000022ms | -3.17% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.0090ms | 0.0083ms | +0.00067ms | +8.04% |
| total | 0.13ms | 0.14ms | -0.0044ms | -3.17% |

### invokeEchoHandler

# Perf Report — invokeEchoHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00046ms |
| p95 | 0.0010ms |
| p99 | 0.0043ms |
| mean | 0.00059ms |
| stdev | 0.00084ms |
| min | 0.00033ms |
| max | 0.0088ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00046ms | -0.000083ms | -18.12% |
| p50 | 0.00046ms | 0.00046ms | -0.0000010ms | -0.22% |
| p95 | 0.0010ms | 0.00058ms | +0.00042ms | +71.87% |
| p99 | 0.0043ms | 0.0043ms | -0.000039ms | -0.90% |
| mean | 0.00059ms | 0.00060ms | -0.000012ms | -2.03% |
| min | 0.00033ms | 0.00042ms | -0.000083ms | -19.95% |
| max | 0.0088ms | 0.0073ms | +0.0015ms | +20.46% |
| total | 0.12ms | 0.12ms | -0.0024ms | -2.03% |

### invokeFiberHandler

# Perf Report — invokeFiberHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00054ms |
| p95 | 0.00075ms |
| p99 | 0.0079ms |
| mean | 0.00076ms |
| stdev | 0.0013ms |
| min | 0.00050ms |
| max | 0.01ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00050ms | +0.000037ms | +7.38% |
| p50 | 0.00054ms | 0.00054ms | +0.0000010ms | +0.18% |
| p95 | 0.00075ms | 0.0010ms | -0.00026ms | -25.36% |
| p99 | 0.0079ms | 0.0038ms | +0.0041ms | +107.41% |
| mean | 0.00076ms | 0.00070ms | +0.000055ms | +7.78% |
| min | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.0024ms | +22.01% |
| total | 0.15ms | 0.14ms | +0.01ms | +7.78% |

### captureChiRoute

# Perf Report — captureChiRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00071ms |
| p50 | 0.00083ms |
| p95 | 0.0015ms |
| p99 | 0.0095ms |
| mean | 0.0011ms |
| stdev | 0.0013ms |
| min | 0.00067ms |
| max | 0.01ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00071ms | 0.00083ms | -0.00013ms | -15.01% |
| p50 | 0.00083ms | 0.00083ms | -0.0000010ms | -0.12% |
| p95 | 0.0015ms | 0.0014ms | +0.000046ms | +3.26% |
| p99 | 0.0095ms | 0.0054ms | +0.0041ms | +76.24% |
| mean | 0.0011ms | 0.0010ms | +0.000016ms | +1.49% |
| min | 0.00067ms | 0.00079ms | -0.00013ms | -15.80% |
| max | 0.01ms | 0.01ms | +0.0019ms | +17.55% |
| total | 0.21ms | 0.21ms | +0.0031ms | +1.49% |

