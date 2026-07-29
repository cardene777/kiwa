# Perf Suite — react-native

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| createRNTestEnv | 0.00067ms | 0.0024ms | 5ms | 0.00033ms | PASS | stable (p10 -6% (閾値未満)、 p95 +104% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| asyncStorageSetGet | 0.00038ms | 0.00050ms | 5ms | 0.00033ms | PASS | improved — gate 無効 (regressionGate=false) |
| navigate | 0.00038ms | 0.0021ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| dispatchLinkingUrl | 0.00046ms | 0.00088ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| setPlatform | 0.00046ms | 0.00067ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createRNTestEnv | 0.02ms | 10ms | PASS |
| asyncStorageSetGet | 0.02ms | 10ms | PASS |
| navigate | 0.01ms | 10ms | PASS |
| dispatchLinkingUrl | 0.01ms | 10ms | PASS |
| setPlatform | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| createRNTestEnv | -5616 B | 0 B | 102400 B | yes | PASS |
| asyncStorageSetGet | -16312 B | 0 B | 102400 B | yes | PASS |
| navigate | 9760 B | 0 B | 102400 B | yes | PASS |
| dispatchLinkingUrl | 1632 B | 0 B | 102400 B | yes | PASS |
| setPlatform | 944 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### createRNTestEnv

# Perf Report — createRNTestEnv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00067ms |
| p50 | 0.00071ms |
| p95 | 0.0024ms |
| p99 | 0.0076ms |
| mean | 0.0010ms |
| stdev | 0.0014ms |
| min | 0.00067ms |
| max | 0.01ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00067ms | 0.00071ms | -0.000041ms | -5.79% |
| p50 | 0.00071ms | 0.00075ms | -0.000042ms | -5.60% |
| p95 | 0.0024ms | 0.0012ms | +0.0012ms | +103.87% |
| p99 | 0.0076ms | 0.0078ms | -0.00022ms | -2.80% |
| mean | 0.0010ms | 0.0010ms | +0.000019ms | +1.94% |
| min | 0.00067ms | 0.00067ms | -0.0000010ms | -0.15% |
| max | 0.01ms | 0.02ms | -0.0016ms | -9.98% |
| total | 0.20ms | 0.20ms | +0.0039ms | +1.94% |

### asyncStorageSetGet

# Perf Report — asyncStorageSetGet.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00050ms |
| p99 | 0.0017ms |
| mean | 0.00047ms |
| stdev | 0.00035ms |
| min | 0.00038ms |
| max | 0.0048ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00096ms | -0.00058ms | -60.86% |
| p50 | 0.00042ms | 0.0010ms | -0.00058ms | -58.30% |
| p95 | 0.00050ms | 0.0017ms | -0.0012ms | -69.86% |
| p99 | 0.0017ms | 0.0035ms | -0.0018ms | -52.18% |
| mean | 0.00047ms | 0.0012ms | -0.00069ms | -59.76% |
| min | 0.00038ms | 0.00092ms | -0.00054ms | -59.06% |
| max | 0.0048ms | 0.0074ms | -0.0025ms | -34.47% |
| total | 0.09ms | 0.23ms | -0.14ms | -59.76% |

### navigate

# Perf Report — navigate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00040ms |
| p95 | 0.0021ms |
| p99 | 0.0074ms |
| mean | 0.00095ms |
| stdev | 0.0021ms |
| min | 0.00033ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p50 | 0.00040ms | 0.00038ms | +0.000021ms | +5.47% |
| p95 | 0.0021ms | 0.0021ms | +0.000050ms | +2.41% |
| p99 | 0.0074ms | 0.0030ms | +0.0045ms | +150.16% |
| mean | 0.00095ms | 0.00072ms | +0.00023ms | +31.43% |
| min | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.02ms | -0.00042ms | -1.89% |
| total | 0.19ms | 0.14ms | +0.05ms | +31.43% |

### dispatchLinkingUrl

# Perf Report — dispatchLinkingUrl.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.00088ms |
| p99 | 0.0034ms |
| mean | 0.00060ms |
| stdev | 0.00083ms |
| min | 0.00042ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00046ms | -0.0000010ms | -0.22% |
| p50 | 0.00050ms | 0.0012ms | -0.00071ms | -58.61% |
| p95 | 0.00088ms | 0.0026ms | -0.0017ms | -66.14% |
| p99 | 0.0034ms | 0.0090ms | -0.0057ms | -62.62% |
| mean | 0.00060ms | 0.0015ms | -0.00091ms | -60.23% |
| min | 0.00042ms | 0.00042ms | +0.0000010ms | +0.24% |
| max | 0.01ms | 0.03ms | -0.02ms | -65.47% |
| total | 0.12ms | 0.30ms | -0.18ms | -60.23% |

### setPlatform

# Perf Report — setPlatform.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00046ms |
| p95 | 0.00067ms |
| p99 | 0.0057ms |
| mean | 0.00063ms |
| stdev | 0.00097ms |
| min | 0.00042ms |
| max | 0.0099ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00042ms | +0.000041ms | +9.86% |
| p50 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p95 | 0.00067ms | 0.00084ms | -0.00017ms | -19.88% |
| p99 | 0.0057ms | 0.0054ms | +0.00023ms | +4.18% |
| mean | 0.00063ms | 0.00061ms | +0.000025ms | +4.14% |
| min | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| max | 0.0099ms | 0.01ms | -0.0015ms | -13.51% |
| total | 0.13ms | 0.12ms | +0.0050ms | +4.14% |

