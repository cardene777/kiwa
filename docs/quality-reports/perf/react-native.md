# Perf Suite — react-native

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| createRNTestEnv | 0.00067ms | 0.0014ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| asyncStorageSetGet | 0.00038ms | 0.00046ms | 5ms | 0.00033ms | PASS | improved — gate 無効 (regressionGate=false) |
| navigate | 0.00038ms | 0.0011ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| dispatchLinkingUrl | 0.00046ms | 0.0010ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
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
| createRNTestEnv | 10000 B | -10838 B | 102400 B | yes | PASS |
| asyncStorageSetGet | -344 B | 0 B | 102400 B | yes | PASS |
| navigate | 616 B | 0 B | 102400 B | yes | PASS |
| dispatchLinkingUrl | 536 B | 0 B | 102400 B | yes | PASS |
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
| p95 | 0.0014ms |
| p99 | 0.0072ms |
| mean | 0.00097ms |
| stdev | 0.0014ms |
| min | 0.00046ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00067ms | 0.00071ms | -0.000042ms | -5.93% |
| p50 | 0.00071ms | 0.00075ms | -0.000042ms | -5.60% |
| p95 | 0.0014ms | 0.0012ms | +0.00022ms | +19.04% |
| p99 | 0.0072ms | 0.0078ms | -0.00059ms | -7.58% |
| mean | 0.00097ms | 0.0010ms | -0.000034ms | -3.37% |
| min | 0.00046ms | 0.00067ms | -0.00021ms | -31.33% |
| max | 0.02ms | 0.02ms | -0.00054ms | -3.41% |
| total | 0.19ms | 0.20ms | -0.0067ms | -3.37% |

### asyncStorageSetGet

# Perf Report — asyncStorageSetGet.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00046ms |
| p99 | 0.0013ms |
| mean | 0.00044ms |
| stdev | 0.00032ms |
| min | 0.00038ms |
| max | 0.0045ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00096ms | -0.00058ms | -60.86% |
| p50 | 0.00042ms | 0.0010ms | -0.00058ms | -58.40% |
| p95 | 0.00046ms | 0.0017ms | -0.0012ms | -72.20% |
| p99 | 0.0013ms | 0.0035ms | -0.0022ms | -64.11% |
| mean | 0.00044ms | 0.0012ms | -0.00072ms | -61.76% |
| min | 0.00038ms | 0.00092ms | -0.00054ms | -59.06% |
| max | 0.0045ms | 0.0074ms | -0.0029ms | -39.54% |
| total | 0.09ms | 0.23ms | -0.14ms | -61.76% |

### navigate

# Perf Report — navigate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.0011ms |
| p99 | 0.0055ms |
| mean | 0.0014ms |
| stdev | 0.01ms |
| min | 0.00038ms |
| max | 0.15ms |
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p50 | 0.00042ms | 0.00038ms | +0.000042ms | +11.20% |
| p95 | 0.0011ms | 0.0021ms | -0.00099ms | -47.66% |
| p99 | 0.0055ms | 0.0030ms | +0.0025ms | +84.85% |
| mean | 0.0014ms | 0.00072ms | +0.00064ms | +87.93% |
| min | 0.00038ms | 0.00033ms | +0.000042ms | +12.61% |
| max | 0.15ms | 0.02ms | +0.13ms | +592.09% |
| total | 0.27ms | 0.14ms | +0.13ms | +87.93% |

### dispatchLinkingUrl

# Perf Report — dispatchLinkingUrl.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00054ms |
| p95 | 0.0010ms |
| p99 | 0.0029ms |
| mean | 0.00066ms |
| stdev | 0.00089ms |
| min | 0.00046ms |
| max | 0.01ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00046ms | -0.0000010ms | -0.22% |
| p50 | 0.00054ms | 0.0012ms | -0.00067ms | -55.13% |
| p95 | 0.0010ms | 0.0026ms | -0.0016ms | -61.39% |
| p99 | 0.0029ms | 0.0090ms | -0.0062ms | -68.11% |
| mean | 0.00066ms | 0.0015ms | -0.00085ms | -56.32% |
| min | 0.00046ms | 0.00042ms | +0.000042ms | +10.10% |
| max | 0.01ms | 0.03ms | -0.02ms | -62.64% |
| total | 0.13ms | 0.30ms | -0.17ms | -56.32% |

### setPlatform

# Perf Report — setPlatform.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00042ms |
| p95 | 0.00059ms |
| p99 | 0.0025ms |
| mean | 0.00052ms |
| stdev | 0.00061ms |
| min | 0.00038ms |
| max | 0.0069ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | -9.0e-7ms | -0.22% |
| p50 | 0.00042ms | 0.00046ms | -0.000041ms | -8.95% |
| p95 | 0.00059ms | 0.00084ms | -0.00025ms | -29.82% |
| p99 | 0.0025ms | 0.0054ms | -0.0029ms | -54.19% |
| mean | 0.00052ms | 0.00061ms | -0.000084ms | -13.88% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.0069ms | 0.01ms | -0.0045ms | -39.41% |
| total | 0.10ms | 0.12ms | -0.02ms | -13.88% |

