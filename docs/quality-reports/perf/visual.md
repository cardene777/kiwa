# Perf Suite — visual

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| comparePngBuffersIdentical | 0.55ms | 2.07ms | 50ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| comparePngBuffersFullDiff | 6.17ms | 8.80ms | 200ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| comparePngBuffersIdentical | 5.88ms | 100ms | PASS |
| comparePngBuffersFullDiff | 32.88ms | 400ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| comparePngBuffersIdentical | 18352 B | 1275271 B | 8388608 B | yes | PASS |
| comparePngBuffersFullDiff | 39072 B | 15498539 B | 16777216 B | yes | PASS |

## Detailed serial reports

### comparePngBuffersIdentical

# Perf Report — comparePngBuffersIdentical.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.55ms |
| p50 | 0.73ms |
| p95 | 2.07ms |
| p99 | 3.71ms |
| mean | 1.03ms |
| stdev | 0.78ms |
| min | 0.34ms |
| max | 4.36ms |
| total | 30.76ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.55ms | 0.90ms | -0.36ms | -39.49% |
| p50 | 0.73ms | 2.04ms | -1.31ms | -64.24% |
| p95 | 2.07ms | 6.22ms | -4.15ms | -66.70% |
| p99 | 3.71ms | 12.97ms | -9.26ms | -71.37% |
| mean | 1.03ms | 2.69ms | -1.66ms | -61.87% |
| min | 0.34ms | 0.76ms | -0.41ms | -54.57% |
| max | 4.36ms | 14.92ms | -10.56ms | -70.80% |
| total | 30.76ms | 80.68ms | -49.91ms | -61.87% |

### comparePngBuffersFullDiff

# Perf Report — comparePngBuffersFullDiff.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 6.17ms |
| p50 | 7.33ms |
| p95 | 8.80ms |
| p99 | 9.35ms |
| mean | 7.30ms |
| stdev | 0.90ms |
| min | 5.67ms |
| max | 9.54ms |
| total | 218.94ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 6.17ms | 6.89ms | -0.72ms | -10.48% |
| p50 | 7.33ms | 8.40ms | -1.07ms | -12.74% |
| p95 | 8.80ms | 13.12ms | -4.32ms | -32.92% |
| p99 | 9.35ms | 14.40ms | -5.05ms | -35.07% |
| mean | 7.30ms | 9.02ms | -1.72ms | -19.09% |
| min | 5.67ms | 6.10ms | -0.42ms | -6.96% |
| max | 9.54ms | 14.83ms | -5.29ms | -35.68% |
| total | 218.94ms | 270.61ms | -51.67ms | -19.09% |

