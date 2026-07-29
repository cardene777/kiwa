# Perf Suite — visual

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| comparePngBuffersIdentical | 0.36ms | 0.71ms | 50ms | 0.00049ms | PASS | improved — gate 無効 (regressionGate=false) |
| comparePngBuffersFullDiff | 5.69ms | 8.39ms | 200ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| comparePngBuffersIdentical | 1.48ms | 100ms | PASS |
| comparePngBuffersFullDiff | 29.16ms | 400ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| comparePngBuffersIdentical | 17328 B | 1551565 B | 8388608 B | yes | PASS |
| comparePngBuffersFullDiff | 36360 B | 2485766 B | 16777216 B | yes | WAIVED (arrayBuffers の振れ幅 26MB が上限 16.7MB を上回り判定が成立しない (#1719)) |

## Detailed serial reports

### comparePngBuffersIdentical

# Perf Report — comparePngBuffersIdentical.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.36ms |
| p50 | 0.42ms |
| p95 | 0.71ms |
| p99 | 0.87ms |
| mean | 0.47ms |
| stdev | 0.13ms |
| min | 0.35ms |
| max | 0.94ms |
| total | 14.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.36ms | 0.90ms | -0.54ms | -59.58% |
| p50 | 0.42ms | 2.04ms | -1.62ms | -79.39% |
| p95 | 0.71ms | 6.22ms | -5.52ms | -88.66% |
| p99 | 0.87ms | 12.97ms | -12.10ms | -93.26% |
| mean | 0.47ms | 2.69ms | -2.22ms | -82.55% |
| min | 0.35ms | 0.76ms | -0.41ms | -54.25% |
| max | 0.94ms | 14.92ms | -13.98ms | -93.71% |
| total | 14.08ms | 80.68ms | -66.60ms | -82.55% |

### comparePngBuffersFullDiff

# Perf Report — comparePngBuffersFullDiff.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 5.69ms |
| p50 | 6.78ms |
| p95 | 8.39ms |
| p99 | 9.12ms |
| mean | 6.78ms |
| stdev | 0.94ms |
| min | 5.26ms |
| max | 9.40ms |
| total | 203.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 5.69ms | 6.89ms | -1.21ms | -17.50% |
| p50 | 6.78ms | 8.40ms | -1.62ms | -19.29% |
| p95 | 8.39ms | 13.12ms | -4.73ms | -36.05% |
| p99 | 9.12ms | 14.40ms | -5.29ms | -36.70% |
| mean | 6.78ms | 9.02ms | -2.24ms | -24.79% |
| min | 5.26ms | 6.10ms | -0.84ms | -13.81% |
| max | 9.40ms | 14.83ms | -5.43ms | -36.64% |
| total | 203.52ms | 270.61ms | -67.09ms | -24.79% |

