# Perf Suite — cli-test

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| writeFile | 0.10ms | 0.16ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| readFile | 0.05ms | 0.08ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| writeFile | 0.34ms | 40ms | PASS |
| readFile | 0.15ms | 20ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| writeFile | 5512 B | -40612 B | 102400 B | yes | PASS |
| readFile | 5112 B | -47195 B | 102400 B | yes | PASS |

## Detailed serial reports

### writeFile

# Perf Report — writeFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.10ms |
| p50 | 0.11ms |
| p95 | 0.16ms |
| p99 | 0.19ms |
| mean | 0.12ms |
| stdev | 0.03ms |
| min | 0.09ms |
| max | 0.26ms |
| total | 12.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.10ms | 0.11ms | -0.01ms | -12.65% |
| p50 | 0.11ms | 0.16ms | -0.05ms | -29.71% |
| p95 | 0.16ms | 0.26ms | -0.09ms | -36.16% |
| p99 | 0.19ms | 0.29ms | -0.11ms | -36.70% |
| mean | 0.12ms | 0.17ms | -0.04ms | -26.91% |
| min | 0.09ms | 0.10ms | -0.01ms | -10.49% |
| max | 0.26ms | 0.32ms | -0.05ms | -16.70% |
| total | 12.12ms | 16.58ms | -4.46ms | -26.91% |

### readFile

# Perf Report — readFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.05ms |
| p95 | 0.08ms |
| p99 | 0.10ms |
| mean | 0.06ms |
| stdev | 0.01ms |
| min | 0.04ms |
| max | 0.11ms |
| total | 5.74ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.0040ms | -7.90% |
| p50 | 0.05ms | 0.07ms | -0.02ms | -28.37% |
| p95 | 0.08ms | 0.50ms | -0.41ms | -82.91% |
| p99 | 0.10ms | 2.30ms | -2.20ms | -95.73% |
| mean | 0.06ms | 0.26ms | -0.20ms | -78.05% |
| min | 0.04ms | 0.04ms | +0.00013ms | +0.28% |
| max | 0.11ms | 10.04ms | -9.93ms | -98.86% |
| total | 5.74ms | 26.13ms | -20.40ms | -78.05% |

