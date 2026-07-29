# Perf Suite — visual

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| comparePngBuffersIdentical | 0.39ms | 0.73ms | 50ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| comparePngBuffersFullDiff | 6.23ms | 8.30ms | 200ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| comparePngBuffersIdentical | 1.39ms | 100ms | PASS |
| comparePngBuffersFullDiff | 26.76ms | 400ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| comparePngBuffersIdentical | 15752 B | 747279 B | 8388608 B | yes | PASS |
| comparePngBuffersFullDiff | 33928 B | -4 B | 16777216 B | yes | WAIVED (arrayBuffers の振れ幅 26MB が上限 16.7MB を上回り判定が成立しない (#1719)) |

## Detailed serial reports

### comparePngBuffersIdentical

# Perf Report — comparePngBuffersIdentical.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.39ms |
| p50 | 0.46ms |
| p95 | 0.73ms |
| p99 | 0.75ms |
| mean | 0.50ms |
| stdev | 0.11ms |
| min | 0.34ms |
| max | 0.76ms |
| total | 14.87ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.39ms | 0.90ms | -0.51ms | -56.69% |
| p50 | 0.46ms | 2.04ms | -1.58ms | -77.60% |
| p95 | 0.73ms | 6.22ms | -5.49ms | -88.19% |
| p99 | 0.75ms | 12.97ms | -12.22ms | -94.19% |
| mean | 0.50ms | 2.69ms | -2.19ms | -81.57% |
| min | 0.34ms | 0.76ms | -0.42ms | -55.06% |
| max | 0.76ms | 14.92ms | -14.16ms | -94.90% |
| total | 14.87ms | 80.68ms | -65.81ms | -81.57% |

### comparePngBuffersFullDiff

# Perf Report — comparePngBuffersFullDiff.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 6.23ms |
| p50 | 7.10ms |
| p95 | 8.30ms |
| p99 | 9.13ms |
| mean | 7.10ms |
| stdev | 0.74ms |
| min | 6.04ms |
| max | 9.41ms |
| total | 213.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 6.23ms | 6.89ms | -0.66ms | -9.58% |
| p50 | 7.10ms | 8.40ms | -1.30ms | -15.46% |
| p95 | 8.30ms | 13.12ms | -4.82ms | -36.72% |
| p99 | 9.13ms | 14.40ms | -5.27ms | -36.61% |
| mean | 7.10ms | 9.02ms | -1.92ms | -21.24% |
| min | 6.04ms | 6.10ms | -0.05ms | -0.89% |
| max | 9.41ms | 14.83ms | -5.43ms | -36.59% |
| total | 213.13ms | 270.61ms | -57.48ms | -21.24% |

