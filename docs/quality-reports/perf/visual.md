# Perf Suite — visual

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| comparePngBuffersIdentical | 0.33ms | 1.01ms | 50ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| comparePngBuffersFullDiff | 5.84ms | 9.37ms | 200ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| comparePngBuffersIdentical | 1.56ms | 100ms | PASS |
| comparePngBuffersFullDiff | 29.71ms | 400ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| comparePngBuffersIdentical | 16912 B | 423048 B | 8388608 B | yes | PASS |
| comparePngBuffersFullDiff | 37208 B | 19731164 B | 16777216 B | yes | WAIVED (arrayBuffers の振れ幅 26MB が上限 16.7MB を上回り判定が成立しない (#1719)) |

## Detailed serial reports

### comparePngBuffersIdentical

# Perf Report — comparePngBuffersIdentical.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.33ms |
| p50 | 0.44ms |
| p95 | 1.01ms |
| p99 | 1.33ms |
| mean | 0.52ms |
| stdev | 0.25ms |
| min | 0.32ms |
| max | 1.40ms |
| total | 15.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.33ms | 0.90ms | -0.57ms | -63.35% |
| p50 | 0.44ms | 2.04ms | -1.61ms | -78.66% |
| p95 | 1.01ms | 6.22ms | -5.21ms | -83.70% |
| p99 | 1.33ms | 12.97ms | -11.63ms | -89.71% |
| mean | 0.52ms | 2.69ms | -2.17ms | -80.82% |
| min | 0.32ms | 0.76ms | -0.44ms | -57.84% |
| max | 1.40ms | 14.92ms | -13.51ms | -90.59% |
| total | 15.47ms | 80.68ms | -65.21ms | -80.82% |

### comparePngBuffersFullDiff

# Perf Report — comparePngBuffersFullDiff.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 5.84ms |
| p50 | 6.69ms |
| p95 | 9.37ms |
| p99 | 9.80ms |
| mean | 7.06ms |
| stdev | 1.13ms |
| min | 5.59ms |
| max | 9.91ms |
| total | 211.68ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 5.84ms | 6.89ms | -1.06ms | -15.35% |
| p50 | 6.69ms | 8.40ms | -1.71ms | -20.34% |
| p95 | 9.37ms | 13.12ms | -3.75ms | -28.59% |
| p99 | 9.80ms | 14.40ms | -4.61ms | -31.99% |
| mean | 7.06ms | 9.02ms | -1.96ms | -21.78% |
| min | 5.59ms | 6.10ms | -0.51ms | -8.34% |
| max | 9.91ms | 14.83ms | -4.92ms | -33.20% |
| total | 211.68ms | 270.61ms | -58.93ms | -21.78% |

