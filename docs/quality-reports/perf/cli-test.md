# Perf Suite — cli-test

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| writeFile | 0.09ms | 0.14ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| readFile | 0.05ms | 0.09ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| writeFile | 0.26ms | 40ms | PASS |
| readFile | 0.13ms | 20ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| writeFile | 4976 B | -13804 B | 102400 B | yes | PASS |
| readFile | 6424 B | -29650 B | 102400 B | yes | PASS |

## Detailed serial reports

### writeFile

# Perf Report — writeFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.09ms |
| p50 | 0.10ms |
| p95 | 0.14ms |
| p99 | 0.15ms |
| mean | 0.11ms |
| stdev | 0.02ms |
| min | 0.09ms |
| max | 0.21ms |
| total | 10.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.09ms | 0.11ms | -0.02ms | -15.71% |
| p50 | 0.10ms | 0.16ms | -0.06ms | -39.13% |
| p95 | 0.14ms | 0.26ms | -0.11ms | -44.34% |
| p99 | 0.15ms | 0.29ms | -0.14ms | -47.43% |
| mean | 0.11ms | 0.17ms | -0.06ms | -35.85% |
| min | 0.09ms | 0.10ms | -0.01ms | -13.74% |
| max | 0.21ms | 0.32ms | -0.11ms | -34.38% |
| total | 10.64ms | 16.58ms | -5.94ms | -35.85% |

### readFile

# Perf Report — readFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.06ms |
| p95 | 0.09ms |
| p99 | 0.12ms |
| mean | 0.06ms |
| stdev | 0.01ms |
| min | 0.04ms |
| max | 0.14ms |
| total | 5.93ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.0017ms | -3.42% |
| p50 | 0.06ms | 0.07ms | -0.01ms | -20.32% |
| p95 | 0.09ms | 0.50ms | -0.41ms | -81.88% |
| p99 | 0.12ms | 2.30ms | -2.18ms | -94.76% |
| mean | 0.06ms | 0.26ms | -0.20ms | -77.32% |
| min | 0.04ms | 0.04ms | -0.0029ms | -6.48% |
| max | 0.14ms | 10.04ms | -9.91ms | -98.65% |
| total | 5.93ms | 26.13ms | -20.20ms | -77.32% |

