# Perf Suite — cli-test

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| writeFile | 0.10ms | 0.28ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| readFile | 0.05ms | 0.10ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| writeFile | 0.52ms | 40ms | PASS |
| readFile | 0.14ms | 20ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| writeFile | 2120 B | -14448 B | 102400 B | yes | PASS |
| readFile | 6328 B | -71595 B | 102400 B | yes | PASS |

## Detailed serial reports

### writeFile

# Perf Report — writeFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.10ms |
| p50 | 0.13ms |
| p95 | 0.28ms |
| p99 | 0.48ms |
| mean | 0.16ms |
| stdev | 0.08ms |
| min | 0.10ms |
| max | 0.52ms |
| total | 16.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.10ms | 0.11ms | -0.0052ms | -4.75% |
| p50 | 0.13ms | 0.16ms | -0.03ms | -18.11% |
| p95 | 0.28ms | 0.26ms | +0.02ms | +8.13% |
| p99 | 0.48ms | 0.29ms | +0.18ms | +61.77% |
| mean | 0.16ms | 0.17ms | -0.0048ms | -2.91% |
| min | 0.10ms | 0.10ms | -0.0042ms | -4.20% |
| max | 0.52ms | 0.32ms | +0.21ms | +65.34% |
| total | 16.10ms | 16.58ms | -0.48ms | -2.91% |

### readFile

# Perf Report — readFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.06ms |
| p95 | 0.10ms |
| p99 | 0.13ms |
| mean | 0.07ms |
| stdev | 0.03ms |
| min | 0.05ms |
| max | 0.27ms |
| total | 6.77ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.0022ms | -4.45% |
| p50 | 0.06ms | 0.07ms | -0.0083ms | -11.80% |
| p95 | 0.10ms | 0.50ms | -0.40ms | -79.80% |
| p99 | 0.13ms | 2.30ms | -2.16ms | -94.31% |
| mean | 0.07ms | 0.26ms | -0.19ms | -74.10% |
| min | 0.05ms | 0.04ms | +0.0016ms | +3.66% |
| max | 0.27ms | 10.04ms | -9.77ms | -97.31% |
| total | 6.77ms | 26.13ms | -19.36ms | -74.10% |

