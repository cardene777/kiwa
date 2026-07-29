# Perf Suite — go-lib

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeGinHandler | 0.00042ms | 0.0020ms | 5ms | 0.00033ms | PASS | stable (p10 0% (閾値未満)、 p95 +36% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| invokeEchoHandler | 0.00042ms | 0.00080ms | 5ms | 0.00033ms | PASS | stable (p10 -9% (閾値未満)、 p95 +37% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| invokeFiberHandler | 0.00038ms | 0.0013ms | 5ms | 0.00033ms | PASS | stable (差 0.00013ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| captureChiRoute | 0.00071ms | 0.0014ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

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
| invokeGinHandler | -12008 B | 0 B | 102400 B | yes | PASS |
| invokeEchoHandler | -25936 B | 0 B | 102400 B | yes | PASS |
| invokeFiberHandler | 8952 B | 0 B | 102400 B | yes | PASS |
| captureChiRoute | -3912 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeGinHandler

# Perf Report — invokeGinHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.0020ms |
| p99 | 0.0043ms |
| mean | 0.00069ms |
| stdev | 0.00091ms |
| min | 0.00038ms |
| max | 0.0088ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p50 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p95 | 0.0020ms | 0.0014ms | +0.00052ms | +35.77% |
| p99 | 0.0043ms | 0.0053ms | -0.0010ms | -18.93% |
| mean | 0.00069ms | 0.00069ms | -0.0000021ms | -0.31% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.0088ms | 0.0083ms | +0.00054ms | +6.52% |
| total | 0.14ms | 0.14ms | -0.00042ms | -0.31% |

### invokeEchoHandler

# Perf Report — invokeEchoHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00050ms |
| p95 | 0.00080ms |
| p99 | 0.0048ms |
| mean | 0.00064ms |
| stdev | 0.00095ms |
| min | 0.00038ms |
| max | 0.01ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00046ms | -0.000042ms | -9.17% |
| p50 | 0.00050ms | 0.00046ms | +0.000041ms | +8.93% |
| p95 | 0.00080ms | 0.00058ms | +0.00022ms | +37.11% |
| p99 | 0.0048ms | 0.0043ms | +0.00050ms | +11.62% |
| mean | 0.00064ms | 0.00060ms | +0.000036ms | +6.07% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.01ms | 0.0073ms | +0.0027ms | +37.50% |
| total | 0.13ms | 0.12ms | +0.0073ms | +6.07% |

### invokeFiberHandler

# Perf Report — invokeFiberHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.0013ms |
| p99 | 0.0082ms |
| mean | 0.0011ms |
| stdev | 0.0060ms |
| min | 0.00038ms |
| max | 0.08ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00050ms | -0.00013ms | -25.00% |
| p50 | 0.00042ms | 0.00054ms | -0.00012ms | -22.92% |
| p95 | 0.0013ms | 0.0010ms | +0.00033ms | +32.34% |
| p99 | 0.0082ms | 0.0038ms | +0.0044ms | +114.91% |
| mean | 0.0011ms | 0.00070ms | +0.00039ms | +54.73% |
| min | 0.00038ms | 0.00050ms | -0.00013ms | -25.00% |
| max | 0.08ms | 0.01ms | +0.07ms | +683.37% |
| total | 0.22ms | 0.14ms | +0.08ms | +54.73% |

### captureChiRoute

# Perf Report — captureChiRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00071ms |
| p50 | 0.00075ms |
| p95 | 0.0014ms |
| p99 | 0.0077ms |
| mean | 0.0010ms |
| stdev | 0.0015ms |
| min | 0.00067ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00071ms | 0.00083ms | -0.00013ms | -15.01% |
| p50 | 0.00075ms | 0.00083ms | -0.000084ms | -10.07% |
| p95 | 0.0014ms | 0.0014ms | +0.000016ms | +1.10% |
| p99 | 0.0077ms | 0.0054ms | +0.0023ms | +42.96% |
| mean | 0.0010ms | 0.0010ms | -0.000014ms | -1.35% |
| min | 0.00067ms | 0.00079ms | -0.00012ms | -15.68% |
| max | 0.02ms | 0.01ms | +0.0056ms | +51.14% |
| total | 0.21ms | 0.21ms | -0.0028ms | -1.35% |

