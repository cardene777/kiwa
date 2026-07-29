# Perf Suite — visual

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| comparePngBuffersIdentical | 0.31ms | 0.62ms | 50ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| comparePngBuffersFullDiff | 5.50ms | 9.12ms | 200ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| comparePngBuffersIdentical | 1.30ms | 100ms | PASS |
| comparePngBuffersFullDiff | 26.75ms | 400ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| comparePngBuffersIdentical | 17536 B | 2039811 B | 8388608 B | yes | PASS |
| comparePngBuffersFullDiff | 33496 B | -460734 B | 16777216 B | yes | WAIVED (arrayBuffers の振れ幅 26MB が上限 16.7MB を上回り判定が成立しない (#1719)) |

## Detailed serial reports

### comparePngBuffersIdentical

# Perf Report — comparePngBuffersIdentical.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.31ms |
| p50 | 0.37ms |
| p95 | 0.62ms |
| p99 | 0.66ms |
| mean | 0.39ms |
| stdev | 0.10ms |
| min | 0.30ms |
| max | 0.66ms |
| total | 11.82ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.31ms | 0.90ms | -0.59ms | -65.66% |
| p50 | 0.37ms | 2.04ms | -1.67ms | -81.91% |
| p95 | 0.62ms | 6.22ms | -5.60ms | -89.98% |
| p99 | 0.66ms | 12.97ms | -12.31ms | -94.90% |
| mean | 0.39ms | 2.69ms | -2.30ms | -85.35% |
| min | 0.30ms | 0.76ms | -0.45ms | -59.86% |
| max | 0.66ms | 14.92ms | -14.26ms | -95.55% |
| total | 11.82ms | 80.68ms | -68.86ms | -85.35% |

### comparePngBuffersFullDiff

# Perf Report — comparePngBuffersFullDiff.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 5.50ms |
| p50 | 6.57ms |
| p95 | 9.12ms |
| p99 | 11.44ms |
| mean | 6.94ms |
| stdev | 1.49ms |
| min | 5.27ms |
| max | 12.37ms |
| total | 208.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 5.50ms | 6.89ms | -1.40ms | -20.29% |
| p50 | 6.57ms | 8.40ms | -1.83ms | -21.78% |
| p95 | 9.12ms | 13.12ms | -4.00ms | -30.48% |
| p99 | 11.44ms | 14.40ms | -2.96ms | -20.55% |
| mean | 6.94ms | 9.02ms | -2.08ms | -23.03% |
| min | 5.27ms | 6.10ms | -0.83ms | -13.55% |
| max | 12.37ms | 14.83ms | -2.46ms | -16.60% |
| total | 208.28ms | 270.61ms | -62.33ms | -23.03% |

