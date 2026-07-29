# Perf Suite — go-lib

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeGinHandler | 0.00042ms | 0.0019ms | 5ms | 0.00033ms | PASS | stable (p10 0% (閾値未満)、 p95 +30% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| invokeEchoHandler | 0.00038ms | 0.00063ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeFiberHandler | 0.00038ms | 0.0011ms | 5ms | 0.00033ms | PASS | stable (差 0.00013ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
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
| invokeGinHandler | -13824 B | 0 B | 102400 B | yes | PASS |
| invokeEchoHandler | -26920 B | 0 B | 102400 B | yes | PASS |
| invokeFiberHandler | -5240 B | 0 B | 102400 B | yes | PASS |
| captureChiRoute | -4816 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeGinHandler

# Perf Report — invokeGinHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00050ms |
| p95 | 0.0019ms |
| p99 | 0.0054ms |
| mean | 0.00071ms |
| stdev | 0.00092ms |
| min | 0.00038ms |
| max | 0.0089ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p50 | 0.00050ms | 0.00046ms | +0.000042ms | +9.17% |
| p95 | 0.0019ms | 0.0014ms | +0.00044ms | +30.33% |
| p99 | 0.0054ms | 0.0053ms | +0.000051ms | +0.95% |
| mean | 0.00071ms | 0.00069ms | +0.000022ms | +3.22% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.0089ms | 0.0083ms | +0.00062ms | +7.54% |
| total | 0.14ms | 0.14ms | +0.0044ms | +3.22% |

### invokeEchoHandler

# Perf Report — invokeEchoHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00046ms |
| p95 | 0.00063ms |
| p99 | 0.0050ms |
| mean | 0.00062ms |
| stdev | 0.00093ms |
| min | 0.00038ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00046ms | -0.000083ms | -18.12% |
| p50 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p95 | 0.00063ms | 0.00058ms | +0.000044ms | +7.55% |
| p99 | 0.0050ms | 0.0043ms | +0.00066ms | +15.32% |
| mean | 0.00062ms | 0.00060ms | +0.000024ms | +3.96% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.01ms | 0.0073ms | +0.0027ms | +36.37% |
| total | 0.12ms | 0.12ms | +0.0048ms | +3.96% |

### invokeFiberHandler

# Perf Report — invokeFiberHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.0011ms |
| p99 | 0.0054ms |
| mean | 0.00065ms |
| stdev | 0.0010ms |
| min | 0.00033ms |
| max | 0.01ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00050ms | -0.00013ms | -25.00% |
| p50 | 0.00042ms | 0.00054ms | -0.00012ms | -22.92% |
| p95 | 0.0011ms | 0.0010ms | +0.000080ms | +7.90% |
| p99 | 0.0054ms | 0.0038ms | +0.0016ms | +42.81% |
| mean | 0.00065ms | 0.00070ms | -0.000057ms | -8.10% |
| min | 0.00033ms | 0.00050ms | -0.00017ms | -33.40% |
| max | 0.01ms | 0.01ms | -0.00054ms | -5.02% |
| total | 0.13ms | 0.14ms | -0.01ms | -8.10% |

### captureChiRoute

# Perf Report — captureChiRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00071ms |
| p50 | 0.00075ms |
| p95 | 0.0014ms |
| p99 | 0.0076ms |
| mean | 0.0010ms |
| stdev | 0.0012ms |
| min | 0.00067ms |
| max | 0.01ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00071ms | 0.00083ms | -0.00013ms | -15.01% |
| p50 | 0.00075ms | 0.00083ms | -0.000084ms | -10.07% |
| p95 | 0.0014ms | 0.0014ms | +0.0000092ms | +0.65% |
| p99 | 0.0076ms | 0.0054ms | +0.0022ms | +40.77% |
| mean | 0.0010ms | 0.0010ms | -0.000014ms | -1.32% |
| min | 0.00067ms | 0.00079ms | -0.00012ms | -15.68% |
| max | 0.01ms | 0.01ms | +0.0015ms | +14.12% |
| total | 0.21ms | 0.21ms | -0.0027ms | -1.32% |

