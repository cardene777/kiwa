# Perf Suite — visual

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| comparePngBuffersIdentical | 0.40ms | 0.94ms | 50ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| comparePngBuffersFullDiff | 6.06ms | 9.05ms | 200ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| comparePngBuffersIdentical | 1.60ms | 100ms | PASS |
| comparePngBuffersFullDiff | 30.27ms | 400ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| comparePngBuffersIdentical | 18712 B | 1309925 B | 8388608 B | yes | PASS |
| comparePngBuffersFullDiff | 39136 B | 8445430 B | 16777216 B | yes | WAIVED (arrayBuffers の振れ幅 26MB が上限 16.7MB を上回り判定が成立しない (#1719)) |

## Detailed serial reports

### comparePngBuffersIdentical

# Perf Report — comparePngBuffersIdentical.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.40ms |
| p50 | 0.53ms |
| p95 | 0.94ms |
| p99 | 1.00ms |
| mean | 0.57ms |
| stdev | 0.17ms |
| min | 0.36ms |
| max | 1.01ms |
| total | 17.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.40ms | 0.90ms | -0.50ms | -55.14% |
| p50 | 0.53ms | 2.04ms | -1.51ms | -74.10% |
| p95 | 0.94ms | 6.22ms | -5.28ms | -84.91% |
| p99 | 1.00ms | 12.97ms | -11.97ms | -92.33% |
| mean | 0.57ms | 2.69ms | -2.12ms | -78.73% |
| min | 0.36ms | 0.76ms | -0.40ms | -52.39% |
| max | 1.01ms | 14.92ms | -13.90ms | -93.20% |
| total | 17.16ms | 80.68ms | -63.51ms | -78.73% |

### comparePngBuffersFullDiff

# Perf Report — comparePngBuffersFullDiff.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 6.06ms |
| p50 | 6.99ms |
| p95 | 9.05ms |
| p99 | 10.50ms |
| mean | 7.31ms |
| stdev | 1.10ms |
| min | 5.91ms |
| max | 10.95ms |
| total | 219.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 6.06ms | 6.89ms | -0.84ms | -12.13% |
| p50 | 6.99ms | 8.40ms | -1.41ms | -16.77% |
| p95 | 9.05ms | 13.12ms | -4.08ms | -31.06% |
| p99 | 10.50ms | 14.40ms | -3.90ms | -27.08% |
| mean | 7.31ms | 9.02ms | -1.71ms | -18.93% |
| min | 5.91ms | 6.10ms | -0.19ms | -3.16% |
| max | 10.95ms | 14.83ms | -3.89ms | -26.21% |
| total | 219.39ms | 270.61ms | -51.22ms | -18.93% |

