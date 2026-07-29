# Perf Suite — react-native

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| createRNTestEnv | 0.00046ms | 0.0021ms | 5ms | 0.00033ms | PASS | stable (差 0.00025ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| asyncStorageSetGet | 0.00038ms | 0.00050ms | 5ms | 0.00033ms | PASS | improved — gate 無効 (regressionGate=false) |
| navigate | 0.00029ms | 0.00088ms | 5ms | 0.00033ms | PASS | stable (差 0.000083ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| dispatchLinkingUrl | 0.00042ms | 0.00067ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| setPlatform | 0.00042ms | 0.00068ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createRNTestEnv | 0.02ms | 10ms | PASS |
| asyncStorageSetGet | 0.01ms | 10ms | PASS |
| navigate | 0.01ms | 10ms | PASS |
| dispatchLinkingUrl | 0.02ms | 10ms | PASS |
| setPlatform | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| createRNTestEnv | 415200 B | 0 B | 102400 B | yes | PASS |
| asyncStorageSetGet | -16464 B | 0 B | 102400 B | yes | PASS |
| navigate | 616 B | 0 B | 102400 B | yes | PASS |
| dispatchLinkingUrl | 712 B | 0 B | 102400 B | yes | PASS |
| setPlatform | 848 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### createRNTestEnv

# Perf Report — createRNTestEnv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00071ms |
| p95 | 0.0021ms |
| p99 | 0.0076ms |
| mean | 0.00096ms |
| stdev | 0.0016ms |
| min | 0.00042ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00071ms | -0.00025ms | -35.31% |
| p50 | 0.00071ms | 0.00075ms | -0.000042ms | -5.60% |
| p95 | 0.0021ms | 0.0012ms | +0.00092ms | +78.97% |
| p99 | 0.0076ms | 0.0078ms | -0.00018ms | -2.26% |
| mean | 0.00096ms | 0.0010ms | -0.000042ms | -4.20% |
| min | 0.00042ms | 0.00067ms | -0.00025ms | -37.63% |
| max | 0.02ms | 0.02ms | -0.00017ms | -1.05% |
| total | 0.19ms | 0.20ms | -0.0084ms | -4.20% |

### asyncStorageSetGet

# Perf Report — asyncStorageSetGet.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00038ms |
| p95 | 0.00050ms |
| p99 | 0.0012ms |
| mean | 0.00043ms |
| stdev | 0.00024ms |
| min | 0.00038ms |
| max | 0.0034ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00096ms | -0.00058ms | -60.86% |
| p50 | 0.00038ms | 0.0010ms | -0.00063ms | -62.50% |
| p95 | 0.00050ms | 0.0017ms | -0.0012ms | -69.99% |
| p99 | 0.0012ms | 0.0035ms | -0.0023ms | -66.54% |
| mean | 0.00043ms | 0.0012ms | -0.00073ms | -63.09% |
| min | 0.00038ms | 0.00092ms | -0.00054ms | -59.06% |
| max | 0.0034ms | 0.0074ms | -0.0040ms | -54.24% |
| total | 0.09ms | 0.23ms | -0.15ms | -63.09% |

### navigate

# Perf Report — navigate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00038ms |
| p95 | 0.00088ms |
| p99 | 0.0032ms |
| mean | 0.00049ms |
| stdev | 0.00096ms |
| min | 0.00029ms |
| max | 0.01ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00038ms | -0.000083ms | -22.13% |
| p50 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p95 | 0.00088ms | 0.0021ms | -0.0012ms | -57.83% |
| p99 | 0.0032ms | 0.0030ms | +0.00025ms | +8.26% |
| mean | 0.00049ms | 0.00072ms | -0.00023ms | -31.52% |
| min | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| max | 0.01ms | 0.02ms | -0.0093ms | -42.07% |
| total | 0.10ms | 0.14ms | -0.05ms | -31.52% |

### dispatchLinkingUrl

# Perf Report — dispatchLinkingUrl.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.00067ms |
| p99 | 0.0025ms |
| mean | 0.00054ms |
| stdev | 0.00067ms |
| min | 0.00038ms |
| max | 0.0089ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00046ms | -0.000043ms | -9.37% |
| p50 | 0.00046ms | 0.0012ms | -0.00075ms | -62.09% |
| p95 | 0.00067ms | 0.0026ms | -0.0019ms | -74.01% |
| p99 | 0.0025ms | 0.0090ms | -0.0066ms | -72.66% |
| mean | 0.00054ms | 0.0015ms | -0.00097ms | -64.08% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.0089ms | 0.03ms | -0.02ms | -72.66% |
| total | 0.11ms | 0.30ms | -0.19ms | -64.08% |

### setPlatform

# Perf Report — setPlatform.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00042ms |
| p95 | 0.00068ms |
| p99 | 0.0020ms |
| mean | 0.00052ms |
| stdev | 0.00051ms |
| min | 0.00038ms |
| max | 0.0057ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | -9.0e-7ms | -0.22% |
| p50 | 0.00042ms | 0.00046ms | -0.000041ms | -8.95% |
| p95 | 0.00068ms | 0.00084ms | -0.00016ms | -18.88% |
| p99 | 0.0020ms | 0.0054ms | -0.0034ms | -62.70% |
| mean | 0.00052ms | 0.00061ms | -0.000089ms | -14.68% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.0057ms | 0.01ms | -0.0057ms | -50.00% |
| total | 0.10ms | 0.12ms | -0.02ms | -14.68% |

