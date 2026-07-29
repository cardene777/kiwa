# Perf Suite — visual

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| comparePngBuffersIdentical | 0.38ms | 0.72ms | 50ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| comparePngBuffersFullDiff | 5.61ms | 8.90ms | 200ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| comparePngBuffersIdentical | 1.80ms | 100ms | PASS |
| comparePngBuffersFullDiff | 29.11ms | 400ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| comparePngBuffersIdentical | 19456 B | 1519323 B | 8388608 B | yes | PASS |
| comparePngBuffersFullDiff | 38960 B | 14666734 B | 16777216 B | yes | PASS |

## Detailed serial reports

### comparePngBuffersIdentical

# Perf Report — comparePngBuffersIdentical.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.38ms |
| p50 | 0.44ms |
| p95 | 0.72ms |
| p99 | 0.77ms |
| mean | 0.48ms |
| stdev | 0.11ms |
| min | 0.35ms |
| max | 0.77ms |
| total | 14.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.38ms | 0.90ms | -0.53ms | -58.28% |
| p50 | 0.44ms | 2.04ms | -1.60ms | -78.29% |
| p95 | 0.72ms | 6.22ms | -5.50ms | -88.36% |
| p99 | 0.77ms | 12.97ms | -12.20ms | -94.09% |
| mean | 0.48ms | 2.69ms | -2.21ms | -82.22% |
| min | 0.35ms | 0.76ms | -0.40ms | -53.10% |
| max | 0.77ms | 14.92ms | -14.15ms | -94.85% |
| total | 14.34ms | 80.68ms | -66.33ms | -82.22% |

### comparePngBuffersFullDiff

# Perf Report — comparePngBuffersFullDiff.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 5.61ms |
| p50 | 6.63ms |
| p95 | 8.90ms |
| p99 | 9.08ms |
| mean | 6.98ms |
| stdev | 1.12ms |
| min | 5.36ms |
| max | 9.14ms |
| total | 209.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 5.61ms | 6.89ms | -1.29ms | -18.66% |
| p50 | 6.63ms | 8.40ms | -1.78ms | -21.15% |
| p95 | 8.90ms | 13.12ms | -4.22ms | -32.19% |
| p99 | 9.08ms | 14.40ms | -5.32ms | -36.94% |
| mean | 6.98ms | 9.02ms | -2.04ms | -22.60% |
| min | 5.36ms | 6.10ms | -0.74ms | -12.10% |
| max | 9.14ms | 14.83ms | -5.69ms | -38.39% |
| total | 209.46ms | 270.61ms | -61.15ms | -22.60% |

