# Perf Suite — cli-test

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限はこの 2 倍 = 0.00033ms。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | gate | regression |
|---|---|---|---|---|---|
| writeFile | 0.16ms | 0.93ms | 20ms | PASS | regressed — gate 無効 (regressionGate=false) |
| readFile | 0.15ms | 4.26ms | 10ms | PASS | regressed — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| writeFile | 1.50ms | 40ms | PASS |
| readFile | 0.79ms | 20ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| writeFile | 6464 B | -97392 B | 102400 B | yes | PASS |
| readFile | 6456 B | -65340 B | 102400 B | yes | PASS |

## Detailed serial reports

### writeFile

# Perf Report — writeFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.16ms |
| p50 | 0.22ms |
| p95 | 0.93ms |
| p99 | 1.19ms |
| mean | 0.32ms |
| stdev | 0.25ms |
| min | 0.12ms |
| max | 1.37ms |
| total | 32.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.16ms | 0.11ms | +0.05ms | +42.80% |
| p50 | 0.22ms | 0.16ms | +0.06ms | +37.62% |
| p95 | 0.93ms | 0.26ms | +0.67ms | +261.02% |
| p99 | 1.19ms | 0.29ms | +0.90ms | +304.89% |
| mean | 0.32ms | 0.17ms | +0.16ms | +94.88% |
| min | 0.12ms | 0.10ms | +0.02ms | +15.14% |
| max | 1.37ms | 0.32ms | +1.06ms | +334.86% |
| total | 32.31ms | 16.58ms | +15.73ms | +94.88% |

### readFile

# Perf Report — readFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.15ms |
| p50 | 0.74ms |
| p95 | 4.26ms |
| p99 | 5.64ms |
| mean | 1.28ms |
| stdev | 1.39ms |
| min | 0.09ms |
| max | 6.23ms |
| total | 128.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.15ms | 0.05ms | +0.10ms | +201.13% |
| p50 | 0.74ms | 0.07ms | +0.67ms | +946.09% |
| p95 | 4.26ms | 0.50ms | +3.77ms | +760.26% |
| p99 | 5.64ms | 2.30ms | +3.35ms | +145.88% |
| mean | 1.28ms | 0.26ms | +1.02ms | +391.13% |
| min | 0.09ms | 0.04ms | +0.05ms | +107.98% |
| max | 6.23ms | 10.04ms | -3.81ms | -37.95% |
| total | 128.34ms | 26.13ms | +102.21ms | +391.13% |

