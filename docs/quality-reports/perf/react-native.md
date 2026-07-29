# Perf Suite — react-native

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00046ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00092ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| createRNTestEnv | 0.00075ms | 0.0016ms | 5ms | 0.00092ms | PASS | stable (検知には +0.00092ms (baseline 比 +129%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| asyncStorageSetGet | 0.00042ms | 0.00059ms | 5ms | 0.00092ms | PASS | stable (差 0.00054ms が下限 0.00092ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| navigate | 0.00038ms | 0.00092ms | 5ms | 0.00092ms | PASS | stable (検知には +0.00092ms (baseline 比 +244%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| dispatchLinkingUrl | 0.00050ms | 0.00063ms | 5ms | 0.00092ms | PASS | stable (検知には +0.00092ms (baseline 比 +200%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| setPlatform | 0.00050ms | 0.00079ms | 5ms | 0.00092ms | PASS | stable (検知には +0.00092ms (baseline 比 +220%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

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
| createRNTestEnv | 17976 B | 0 B | 102400 B | yes | PASS |
| asyncStorageSetGet | -232 B | 0 B | 102400 B | yes | PASS |
| navigate | -12576 B | 0 B | 102400 B | yes | PASS |
| dispatchLinkingUrl | -1792 B | 0 B | 102400 B | yes | PASS |
| setPlatform | 720 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### createRNTestEnv

# Perf Report — createRNTestEnv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00075ms |
| p50 | 0.00079ms |
| p95 | 0.0016ms |
| p99 | 0.0084ms |
| mean | 0.0011ms |
| stdev | 0.0019ms |
| min | 0.00075ms |
| max | 0.02ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00075ms | 0.00071ms | +0.000042ms | +5.93% |
| p50 | 0.00079ms | 0.00075ms | +0.000042ms | +5.60% |
| p95 | 0.0016ms | 0.0012ms | +0.00047ms | +40.61% |
| p99 | 0.0084ms | 0.0078ms | +0.00063ms | +8.02% |
| mean | 0.0011ms | 0.0010ms | +0.00012ms | +11.86% |
| min | 0.00075ms | 0.00067ms | +0.000083ms | +12.44% |
| max | 0.02ms | 0.02ms | +0.0032ms | +20.21% |
| total | 0.22ms | 0.20ms | +0.02ms | +11.86% |

### asyncStorageSetGet

# Perf Report — asyncStorageSetGet.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.00059ms |
| p99 | 0.0015ms |
| mean | 0.00051ms |
| stdev | 0.00033ms |
| min | 0.00042ms |
| max | 0.0047ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00096ms | -0.00054ms | -56.58% |
| p50 | 0.00046ms | 0.0010ms | -0.00054ms | -54.20% |
| p95 | 0.00059ms | 0.0017ms | -0.0011ms | -64.88% |
| p99 | 0.0015ms | 0.0035ms | -0.0020ms | -58.15% |
| mean | 0.00051ms | 0.0012ms | -0.00065ms | -56.16% |
| min | 0.00042ms | 0.00092ms | -0.00050ms | -54.59% |
| max | 0.0047ms | 0.0074ms | -0.0027ms | -36.72% |
| total | 0.10ms | 0.23ms | -0.13ms | -56.16% |

### navigate

# Perf Report — navigate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00038ms |
| p95 | 0.00092ms |
| p99 | 0.0033ms |
| mean | 0.00048ms |
| stdev | 0.00060ms |
| min | 0.00033ms |
| max | 0.0067ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p50 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p95 | 0.00092ms | 0.0021ms | -0.0012ms | -55.97% |
| p99 | 0.0033ms | 0.0030ms | +0.00029ms | +9.90% |
| mean | 0.00048ms | 0.00072ms | -0.00024ms | -32.90% |
| min | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| max | 0.0067ms | 0.02ms | -0.02ms | -69.43% |
| total | 0.10ms | 0.14ms | -0.05ms | -32.90% |

### dispatchLinkingUrl

# Perf Report — dispatchLinkingUrl.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.00063ms |
| p99 | 0.0030ms |
| mean | 0.00066ms |
| stdev | 0.00097ms |
| min | 0.00050ms |
| max | 0.01ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00046ms | +0.000041ms | +8.93% |
| p50 | 0.00054ms | 0.0012ms | -0.00067ms | -55.13% |
| p95 | 0.00063ms | 0.0026ms | -0.0020ms | -75.87% |
| p99 | 0.0030ms | 0.0090ms | -0.0060ms | -66.70% |
| mean | 0.00066ms | 0.0015ms | -0.00086ms | -56.64% |
| min | 0.00050ms | 0.00042ms | +0.000084ms | +20.19% |
| max | 0.01ms | 0.03ms | -0.02ms | -58.28% |
| total | 0.13ms | 0.30ms | -0.17ms | -56.64% |

### setPlatform

# Perf Report — setPlatform.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.00079ms |
| p99 | 0.0028ms |
| mean | 0.00065ms |
| stdev | 0.00074ms |
| min | 0.00050ms |
| max | 0.0085ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00042ms | +0.000083ms | +19.93% |
| p50 | 0.00054ms | 0.00046ms | +0.000084ms | +18.34% |
| p95 | 0.00079ms | 0.00084ms | -0.000041ms | -4.92% |
| p99 | 0.0028ms | 0.0054ms | -0.0026ms | -47.91% |
| mean | 0.00065ms | 0.00061ms | +0.000046ms | +7.60% |
| min | 0.00050ms | 0.00042ms | +0.000084ms | +20.19% |
| max | 0.0085ms | 0.01ms | -0.0030ms | -25.92% |
| total | 0.13ms | 0.12ms | +0.0092ms | +7.60% |

