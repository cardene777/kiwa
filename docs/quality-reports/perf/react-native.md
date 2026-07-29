# Perf Suite — react-native

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| createRNTestEnv | 0.00042ms | 0.0020ms | 5ms | 0.00033ms | PASS | stable (差 0.00029ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| asyncStorageSetGet | 0.00038ms | 0.00046ms | 5ms | 0.00033ms | PASS | improved — gate 無効 (regressionGate=false) |
| navigate | 0.00033ms | 0.00079ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| dispatchLinkingUrl | 0.00046ms | 0.00067ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| setPlatform | 0.00042ms | 0.00059ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createRNTestEnv | 0.02ms | 10ms | PASS |
| asyncStorageSetGet | 0.01ms | 10ms | PASS |
| navigate | 0.01ms | 10ms | PASS |
| dispatchLinkingUrl | 0.01ms | 10ms | PASS |
| setPlatform | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| createRNTestEnv | 6152 B | -74724 B | 102400 B | yes | PASS |
| asyncStorageSetGet | -216 B | 0 B | 102400 B | yes | PASS |
| navigate | -15384 B | 0 B | 102400 B | yes | PASS |
| dispatchLinkingUrl | -1544 B | 0 B | 102400 B | yes | PASS |
| setPlatform | 848 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### createRNTestEnv

# Perf Report — createRNTestEnv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00050ms |
| p95 | 0.0020ms |
| p99 | 0.0099ms |
| mean | 0.00090ms |
| stdev | 0.0016ms |
| min | 0.00042ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00071ms | -0.00029ms | -41.10% |
| p50 | 0.00050ms | 0.00075ms | -0.00025ms | -33.33% |
| p95 | 0.0020ms | 0.0012ms | +0.00083ms | +71.41% |
| p99 | 0.0099ms | 0.0078ms | +0.0021ms | +27.34% |
| mean | 0.00090ms | 0.0010ms | -0.00010ms | -10.21% |
| min | 0.00042ms | 0.00067ms | -0.00025ms | -37.63% |
| max | 0.02ms | 0.02ms | -0.00071ms | -4.47% |
| total | 0.18ms | 0.20ms | -0.02ms | -10.21% |

### asyncStorageSetGet

# Perf Report — asyncStorageSetGet.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00038ms |
| p95 | 0.00046ms |
| p99 | 0.0013ms |
| mean | 0.00043ms |
| stdev | 0.00028ms |
| min | 0.00033ms |
| max | 0.0039ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00096ms | -0.00058ms | -60.86% |
| p50 | 0.00038ms | 0.0010ms | -0.00063ms | -62.50% |
| p95 | 0.00046ms | 0.0017ms | -0.0012ms | -72.45% |
| p99 | 0.0013ms | 0.0035ms | -0.0022ms | -62.86% |
| mean | 0.00043ms | 0.0012ms | -0.00074ms | -63.25% |
| min | 0.00033ms | 0.00092ms | -0.00058ms | -63.65% |
| max | 0.0039ms | 0.0074ms | -0.0035ms | -46.89% |
| total | 0.09ms | 0.23ms | -0.15ms | -63.25% |

### navigate

# Perf Report — navigate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.00079ms |
| p99 | 0.0026ms |
| mean | 0.00066ms |
| stdev | 0.0030ms |
| min | 0.00033ms |
| max | 0.04ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00038ms | -0.000041ms | -10.93% |
| p50 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p95 | 0.00079ms | 0.0021ms | -0.0013ms | -61.96% |
| p99 | 0.0026ms | 0.0030ms | -0.00041ms | -13.94% |
| mean | 0.00066ms | 0.00072ms | -0.000060ms | -8.24% |
| min | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| max | 0.04ms | 0.02ms | +0.02ms | +95.66% |
| total | 0.13ms | 0.14ms | -0.01ms | -8.24% |

### dispatchLinkingUrl

# Perf Report — dispatchLinkingUrl.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00046ms |
| p95 | 0.00067ms |
| p99 | 0.0027ms |
| mean | 0.00058ms |
| stdev | 0.00086ms |
| min | 0.00046ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00046ms | -0.0000010ms | -0.22% |
| p50 | 0.00046ms | 0.0012ms | -0.00075ms | -62.00% |
| p95 | 0.00067ms | 0.0026ms | -0.0019ms | -74.17% |
| p99 | 0.0027ms | 0.0090ms | -0.0064ms | -70.34% |
| mean | 0.00058ms | 0.0015ms | -0.00093ms | -61.58% |
| min | 0.00046ms | 0.00042ms | +0.000042ms | +10.10% |
| max | 0.01ms | 0.03ms | -0.02ms | -63.41% |
| total | 0.12ms | 0.30ms | -0.19ms | -61.58% |

### setPlatform

# Perf Report — setPlatform.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.00059ms |
| p99 | 0.0022ms |
| mean | 0.00054ms |
| stdev | 0.00063ms |
| min | 0.00042ms |
| max | 0.0076ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | -9.0e-7ms | -0.22% |
| p50 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p95 | 0.00059ms | 0.00084ms | -0.00024ms | -29.33% |
| p99 | 0.0022ms | 0.0054ms | -0.0032ms | -59.54% |
| mean | 0.00054ms | 0.00061ms | -0.000064ms | -10.49% |
| min | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| max | 0.0076ms | 0.01ms | -0.0038ms | -33.21% |
| total | 0.11ms | 0.12ms | -0.01ms | -10.49% |

