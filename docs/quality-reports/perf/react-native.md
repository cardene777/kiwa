# Perf Suite — react-native

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| createRNTestEnv | 0.00042ms | 0.0027ms | 5ms | 0.00033ms | PASS | stable (差 0.00029ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| asyncStorageSetGet | 0.00038ms | 0.00046ms | 5ms | 0.00033ms | PASS | improved — gate 無効 (regressionGate=false) |
| navigate | 0.00029ms | 0.00084ms | 5ms | 0.00033ms | PASS | stable (差 0.000083ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| dispatchLinkingUrl | 0.00042ms | 0.00071ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| setPlatform | 0.00042ms | 0.00067ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createRNTestEnv | 0.01ms | 10ms | PASS |
| asyncStorageSetGet | 0.01ms | 10ms | PASS |
| navigate | 0.01ms | 10ms | PASS |
| dispatchLinkingUrl | 0.01ms | 10ms | PASS |
| setPlatform | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| createRNTestEnv | -11680 B | 0 B | 102400 B | yes | PASS |
| asyncStorageSetGet | -16304 B | 0 B | 102400 B | yes | PASS |
| navigate | 264 B | 0 B | 102400 B | yes | PASS |
| dispatchLinkingUrl | 712 B | 0 B | 102400 B | yes | PASS |
| setPlatform | 944 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### createRNTestEnv

# Perf Report — createRNTestEnv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00056ms |
| p95 | 0.0027ms |
| p99 | 0.0099ms |
| mean | 0.0011ms |
| stdev | 0.0018ms |
| min | 0.00038ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00071ms | -0.00029ms | -41.10% |
| p50 | 0.00056ms | 0.00075ms | -0.00019ms | -25.00% |
| p95 | 0.0027ms | 0.0012ms | +0.0016ms | +132.97% |
| p99 | 0.0099ms | 0.0078ms | +0.0022ms | +27.61% |
| mean | 0.0011ms | 0.0010ms | +0.000064ms | +6.36% |
| min | 0.00038ms | 0.00067ms | -0.00029ms | -43.78% |
| max | 0.02ms | 0.02ms | +0.00013ms | +0.79% |
| total | 0.21ms | 0.20ms | +0.01ms | +6.36% |

### asyncStorageSetGet

# Perf Report — asyncStorageSetGet.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00038ms |
| p95 | 0.00046ms |
| p99 | 0.0010ms |
| mean | 0.00042ms |
| stdev | 0.00028ms |
| min | 0.00033ms |
| max | 0.0040ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00096ms | -0.00058ms | -60.86% |
| p50 | 0.00038ms | 0.0010ms | -0.00063ms | -62.50% |
| p95 | 0.00046ms | 0.0017ms | -0.0012ms | -72.33% |
| p99 | 0.0010ms | 0.0035ms | -0.0024ms | -70.14% |
| mean | 0.00042ms | 0.0012ms | -0.00075ms | -64.27% |
| min | 0.00033ms | 0.00092ms | -0.00058ms | -63.65% |
| max | 0.0040ms | 0.0074ms | -0.0033ms | -45.21% |
| total | 0.08ms | 0.23ms | -0.15ms | -64.27% |

### navigate

# Perf Report — navigate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00084ms |
| p99 | 0.0029ms |
| mean | 0.00045ms |
| stdev | 0.00051ms |
| min | 0.00029ms |
| max | 0.0048ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00038ms | -0.000083ms | -22.13% |
| p50 | 0.00033ms | 0.00038ms | -0.000041ms | -10.93% |
| p95 | 0.00084ms | 0.0021ms | -0.0013ms | -59.95% |
| p99 | 0.0029ms | 0.0030ms | -0.000077ms | -2.58% |
| mean | 0.00045ms | 0.00072ms | -0.00027ms | -37.86% |
| min | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| max | 0.0048ms | 0.02ms | -0.02ms | -78.30% |
| total | 0.09ms | 0.14ms | -0.05ms | -37.86% |

### dispatchLinkingUrl

# Perf Report — dispatchLinkingUrl.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00042ms |
| p95 | 0.00071ms |
| p99 | 0.0026ms |
| mean | 0.00054ms |
| stdev | 0.00069ms |
| min | 0.00038ms |
| max | 0.0093ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00046ms | -0.000043ms | -9.37% |
| p50 | 0.00042ms | 0.0012ms | -0.00079ms | -65.48% |
| p95 | 0.00071ms | 0.0026ms | -0.0019ms | -72.51% |
| p99 | 0.0026ms | 0.0090ms | -0.0065ms | -71.77% |
| mean | 0.00054ms | 0.0015ms | -0.00098ms | -64.54% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.0093ms | 0.03ms | -0.02ms | -71.37% |
| total | 0.11ms | 0.30ms | -0.20ms | -64.54% |

### setPlatform

# Perf Report — setPlatform.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00042ms |
| p95 | 0.00067ms |
| p99 | 0.0048ms |
| mean | 0.00097ms |
| stdev | 0.0062ms |
| min | 0.00038ms |
| max | 0.09ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | -9.0e-7ms | -0.22% |
| p50 | 0.00042ms | 0.00046ms | -0.000041ms | -8.95% |
| p95 | 0.00067ms | 0.00084ms | -0.00016ms | -19.63% |
| p99 | 0.0048ms | 0.0054ms | -0.00066ms | -12.14% |
| mean | 0.00097ms | 0.00061ms | +0.00036ms | +59.56% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.09ms | 0.01ms | +0.08ms | +674.06% |
| total | 0.19ms | 0.12ms | +0.07ms | +59.56% |

