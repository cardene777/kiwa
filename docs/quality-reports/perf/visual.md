# Perf Suite — visual

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| comparePngBuffersIdentical | 0.35ms | 0.89ms | 50ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| comparePngBuffersFullDiff | 6.43ms | 35.58ms | 200ms | 0.00042ms | PASS | stable (p10 -7% (閾値未満)、 p95 +171% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| comparePngBuffersIdentical | 2.03ms | 100ms | PASS |
| comparePngBuffersFullDiff | 99.74ms | 400ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| comparePngBuffersIdentical | 18568 B | 1946629 B | 8388608 B | yes | PASS |
| comparePngBuffersFullDiff | 37440 B | 8282892 B | 16777216 B | yes | WAIVED (arrayBuffers の振れ幅 26MB が上限 16.7MB を上回り判定が成立しない (#1719)) |

## Detailed serial reports

### comparePngBuffersIdentical

# Perf Report — comparePngBuffersIdentical.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.35ms |
| p50 | 0.41ms |
| p95 | 0.89ms |
| p99 | 1.11ms |
| mean | 0.51ms |
| stdev | 0.22ms |
| min | 0.34ms |
| max | 1.19ms |
| total | 15.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.35ms | 0.90ms | -0.55ms | -60.71% |
| p50 | 0.41ms | 2.04ms | -1.63ms | -79.92% |
| p95 | 0.89ms | 6.22ms | -5.33ms | -85.68% |
| p99 | 1.11ms | 12.97ms | -11.86ms | -91.47% |
| mean | 0.51ms | 2.69ms | -2.18ms | -81.03% |
| min | 0.34ms | 0.76ms | -0.42ms | -55.49% |
| max | 1.19ms | 14.92ms | -13.73ms | -92.02% |
| total | 15.31ms | 80.68ms | -65.37ms | -81.03% |

### comparePngBuffersFullDiff

# Perf Report — comparePngBuffersFullDiff.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 6.43ms |
| p50 | 9.01ms |
| p95 | 35.58ms |
| p99 | 54.85ms |
| mean | 12.76ms |
| stdev | 11.87ms |
| min | 5.71ms |
| max | 62.34ms |
| total | 382.70ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 6.43ms | 6.89ms | -0.47ms | -6.79% |
| p50 | 9.01ms | 8.40ms | +0.61ms | +7.27% |
| p95 | 35.58ms | 13.12ms | +22.46ms | +171.17% |
| p99 | 54.85ms | 14.40ms | +40.45ms | +280.87% |
| mean | 12.76ms | 9.02ms | +3.74ms | +41.42% |
| min | 5.71ms | 6.10ms | -0.39ms | -6.44% |
| max | 62.34ms | 14.83ms | +47.51ms | +320.29% |
| total | 382.70ms | 270.61ms | +112.09ms | +41.42% |

