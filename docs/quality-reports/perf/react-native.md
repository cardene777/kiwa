# Perf Suite — react-native

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| createRNTestEnv | 0.00042ms | 0.0021ms | 5ms | 0.00033ms | PASS | stable (差 0.00029ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| asyncStorageSetGet | 0.00042ms | 0.00050ms | 5ms | 0.00033ms | PASS | improved — gate 無効 (regressionGate=false) |
| navigate | 0.00033ms | 0.00079ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| dispatchLinkingUrl | 0.00042ms | 0.00067ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| setPlatform | 0.00042ms | 0.00072ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

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
| createRNTestEnv | -11400 B | 0 B | 102400 B | yes | PASS |
| asyncStorageSetGet | -15104 B | 0 B | 102400 B | yes | PASS |
| navigate | 712 B | 0 B | 102400 B | yes | PASS |
| dispatchLinkingUrl | 712 B | 0 B | 102400 B | yes | PASS |
| setPlatform | 848 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### createRNTestEnv

# Perf Report — createRNTestEnv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.0021ms |
| p99 | 0.0073ms |
| mean | 0.00098ms |
| stdev | 0.0017ms |
| min | 0.00042ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00071ms | -0.00029ms | -41.10% |
| p50 | 0.00046ms | 0.00075ms | -0.00029ms | -38.80% |
| p95 | 0.0021ms | 0.0012ms | +0.00088ms | +75.56% |
| p99 | 0.0073ms | 0.0078ms | -0.00052ms | -6.63% |
| mean | 0.00098ms | 0.0010ms | -0.000019ms | -1.85% |
| min | 0.00042ms | 0.00067ms | -0.00025ms | -37.63% |
| max | 0.02ms | 0.02ms | -0.00025ms | -1.57% |
| total | 0.20ms | 0.20ms | -0.0037ms | -1.85% |

### asyncStorageSetGet

# Perf Report — asyncStorageSetGet.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00042ms |
| p95 | 0.00050ms |
| p99 | 0.0013ms |
| mean | 0.00046ms |
| stdev | 0.00027ms |
| min | 0.00038ms |
| max | 0.0039ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00096ms | -0.00054ms | -56.58% |
| p50 | 0.00042ms | 0.0010ms | -0.00058ms | -58.30% |
| p95 | 0.00050ms | 0.0017ms | -0.0012ms | -69.99% |
| p99 | 0.0013ms | 0.0035ms | -0.0022ms | -62.94% |
| mean | 0.00046ms | 0.0012ms | -0.00070ms | -60.01% |
| min | 0.00038ms | 0.00092ms | -0.00054ms | -59.06% |
| max | 0.0039ms | 0.0074ms | -0.0035ms | -47.46% |
| total | 0.09ms | 0.23ms | -0.14ms | -60.01% |

### navigate

# Perf Report — navigate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.00079ms |
| p99 | 0.0042ms |
| mean | 0.00051ms |
| stdev | 0.0011ms |
| min | 0.00029ms |
| max | 0.01ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| p50 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p95 | 0.00079ms | 0.0021ms | -0.0013ms | -61.96% |
| p99 | 0.0042ms | 0.0030ms | +0.0012ms | +40.32% |
| mean | 0.00051ms | 0.00072ms | -0.00021ms | -29.52% |
| min | 0.00029ms | 0.00033ms | -0.000041ms | -12.31% |
| max | 0.01ms | 0.02ms | -0.0081ms | -36.79% |
| total | 0.10ms | 0.14ms | -0.04ms | -29.52% |

### dispatchLinkingUrl

# Perf Report — dispatchLinkingUrl.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.00067ms |
| p99 | 0.0032ms |
| mean | 0.00057ms |
| stdev | 0.00082ms |
| min | 0.00038ms |
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00046ms | -0.000043ms | -9.37% |
| p50 | 0.00046ms | 0.0012ms | -0.00075ms | -62.09% |
| p95 | 0.00067ms | 0.0026ms | -0.0019ms | -74.09% |
| p99 | 0.0032ms | 0.0090ms | -0.0059ms | -64.89% |
| mean | 0.00057ms | 0.0015ms | -0.00094ms | -62.40% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.01ms | 0.03ms | -0.02ms | -65.98% |
| total | 0.11ms | 0.30ms | -0.19ms | -62.40% |

### setPlatform

# Perf Report — setPlatform.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00042ms |
| p95 | 0.00072ms |
| p99 | 0.0051ms |
| mean | 0.00090ms |
| stdev | 0.0054ms |
| min | 0.00033ms |
| max | 0.08ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | -9.0e-7ms | -0.22% |
| p50 | 0.00042ms | 0.00046ms | -0.000041ms | -8.95% |
| p95 | 0.00072ms | 0.00084ms | -0.00012ms | -14.22% |
| p99 | 0.0051ms | 0.0054ms | -0.00038ms | -6.93% |
| mean | 0.00090ms | 0.00061ms | +0.00029ms | +48.14% |
| min | 0.00033ms | 0.00042ms | -0.000082ms | -19.71% |
| max | 0.08ms | 0.01ms | +0.06ms | +563.85% |
| total | 0.18ms | 0.12ms | +0.06ms | +48.14% |

