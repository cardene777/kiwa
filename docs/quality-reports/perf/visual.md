# Perf Suite — visual

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| comparePngBuffersIdentical | 0.33ms | 0.75ms | 50ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| comparePngBuffersFullDiff | 5.73ms | 7.82ms | 200ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| comparePngBuffersIdentical | 1.43ms | 100ms | PASS |
| comparePngBuffersFullDiff | 27.93ms | 400ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| comparePngBuffersIdentical | 16784 B | 2375101 B | 8388608 B | yes | PASS |
| comparePngBuffersFullDiff | 39608 B | 13680998 B | 16777216 B | yes | WAIVED (arrayBuffers の振れ幅 26MB が上限 16.7MB を上回り判定が成立しない (#1719)) |

## Detailed serial reports

### comparePngBuffersIdentical

# Perf Report — comparePngBuffersIdentical.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.33ms |
| p50 | 0.39ms |
| p95 | 0.75ms |
| p99 | 0.96ms |
| mean | 0.44ms |
| stdev | 0.16ms |
| min | 0.29ms |
| max | 1.04ms |
| total | 13.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.33ms | 0.90ms | -0.57ms | -63.31% |
| p50 | 0.39ms | 2.04ms | -1.65ms | -80.71% |
| p95 | 0.75ms | 6.22ms | -5.47ms | -87.94% |
| p99 | 0.96ms | 12.97ms | -12.01ms | -92.60% |
| mean | 0.44ms | 2.69ms | -2.25ms | -83.53% |
| min | 0.29ms | 0.76ms | -0.46ms | -61.40% |
| max | 1.04ms | 14.92ms | -13.88ms | -93.03% |
| total | 13.29ms | 80.68ms | -67.39ms | -83.53% |

### comparePngBuffersFullDiff

# Perf Report — comparePngBuffersFullDiff.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 5.73ms |
| p50 | 6.34ms |
| p95 | 7.82ms |
| p99 | 8.32ms |
| mean | 6.52ms |
| stdev | 0.74ms |
| min | 5.59ms |
| max | 8.47ms |
| total | 195.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 5.73ms | 6.89ms | -1.17ms | -16.96% |
| p50 | 6.34ms | 8.40ms | -2.06ms | -24.53% |
| p95 | 7.82ms | 13.12ms | -5.30ms | -40.41% |
| p99 | 8.32ms | 14.40ms | -6.08ms | -42.22% |
| mean | 6.52ms | 9.02ms | -2.50ms | -27.72% |
| min | 5.59ms | 6.10ms | -0.51ms | -8.38% |
| max | 8.47ms | 14.83ms | -6.36ms | -42.88% |
| total | 195.59ms | 270.61ms | -75.02ms | -27.72% |

