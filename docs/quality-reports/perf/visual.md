# Perf Suite — visual

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限はこの 2 倍 = 0.00042ms。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | gate | regression |
|---|---|---|---|---|---|
| comparePngBuffersIdentical | 0.40ms | 1.28ms | 50ms | PASS | improved — gate 無効 (regressionGate=false) |
| comparePngBuffersFullDiff | 6.32ms | 10.33ms | 200ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| comparePngBuffersIdentical | 2.18ms | 100ms | PASS |
| comparePngBuffersFullDiff | 31.10ms | 400ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| comparePngBuffersIdentical | 19488 B | 1310943 B | 8388608 B | yes | PASS |
| comparePngBuffersFullDiff | 38032 B | 8926783 B | 16777216 B | yes | PASS |

## Detailed serial reports

### comparePngBuffersIdentical

# Perf Report — comparePngBuffersIdentical.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.40ms |
| p50 | 0.59ms |
| p95 | 1.28ms |
| p99 | 1.87ms |
| mean | 0.73ms |
| stdev | 0.36ms |
| min | 0.36ms |
| max | 2.08ms |
| total | 21.76ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.40ms | 0.90ms | -0.51ms | -56.20% |
| p50 | 0.59ms | 2.04ms | -1.45ms | -70.89% |
| p95 | 1.28ms | 6.22ms | -4.94ms | -79.38% |
| p99 | 1.87ms | 12.97ms | -11.10ms | -85.56% |
| mean | 0.73ms | 2.69ms | -1.96ms | -73.03% |
| min | 0.36ms | 0.76ms | -0.39ms | -51.78% |
| max | 2.08ms | 14.92ms | -12.84ms | -86.04% |
| total | 21.76ms | 80.68ms | -58.92ms | -73.03% |

### comparePngBuffersFullDiff

# Perf Report — comparePngBuffersFullDiff.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 6.32ms |
| p50 | 7.49ms |
| p95 | 10.33ms |
| p99 | 12.58ms |
| mean | 7.92ms |
| stdev | 1.64ms |
| min | 5.90ms |
| max | 13.41ms |
| total | 237.69ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 6.32ms | 6.89ms | -0.57ms | -8.27% |
| p50 | 7.49ms | 8.40ms | -0.91ms | -10.83% |
| p95 | 10.33ms | 13.12ms | -2.79ms | -21.29% |
| p99 | 12.58ms | 14.40ms | -1.82ms | -12.62% |
| mean | 7.92ms | 9.02ms | -1.10ms | -12.17% |
| min | 5.90ms | 6.10ms | -0.20ms | -3.29% |
| max | 13.41ms | 14.83ms | -1.42ms | -9.60% |
| total | 237.69ms | 270.61ms | -32.92ms | -12.17% |

