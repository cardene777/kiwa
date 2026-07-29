# Perf Suite — cli-test

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| writeFile | 0.13ms | 0.54ms | 20ms | 0.00042ms | PASS | regressed — gate 無効 (regressionGate=false) |
| readFile | 0.05ms | 0.21ms | 10ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| writeFile | 0.57ms | 40ms | PASS |
| readFile | 0.19ms | 20ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| writeFile | 5456 B | -6648 B | 102400 B | yes | PASS |
| readFile | 6424 B | 28696 B | 102400 B | yes | PASS |

## Detailed serial reports

### writeFile

# Perf Report — writeFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.13ms |
| p50 | 0.19ms |
| p95 | 0.54ms |
| p99 | 0.61ms |
| mean | 0.23ms |
| stdev | 0.12ms |
| min | 0.11ms |
| max | 0.63ms |
| total | 23.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.13ms | 0.11ms | +0.02ms | +22.24% |
| p50 | 0.19ms | 0.16ms | +0.03ms | +16.34% |
| p95 | 0.54ms | 0.26ms | +0.28ms | +109.52% |
| p99 | 0.61ms | 0.29ms | +0.32ms | +108.40% |
| mean | 0.23ms | 0.17ms | +0.07ms | +40.38% |
| min | 0.11ms | 0.10ms | +0.0042ms | +4.11% |
| max | 0.63ms | 0.32ms | +0.32ms | +100.09% |
| total | 23.28ms | 16.58ms | +6.70ms | +40.38% |

### readFile

# Perf Report — readFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.09ms |
| p95 | 0.21ms |
| p99 | 0.25ms |
| mean | 0.10ms |
| stdev | 0.05ms |
| min | 0.04ms |
| max | 0.37ms |
| total | 10.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.0025ms | -4.88% |
| p50 | 0.09ms | 0.07ms | +0.02ms | +21.56% |
| p95 | 0.21ms | 0.50ms | -0.28ms | -57.14% |
| p99 | 0.25ms | 2.30ms | -2.04ms | -89.04% |
| mean | 0.10ms | 0.26ms | -0.16ms | -61.37% |
| min | 0.04ms | 0.04ms | -0.0036ms | -8.17% |
| max | 0.37ms | 10.04ms | -9.68ms | -96.36% |
| total | 10.09ms | 26.13ms | -16.04ms | -61.37% |

