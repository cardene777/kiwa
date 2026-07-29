# Perf Suite — cli-test

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| writeFile | 0.10ms | 0.23ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| readFile | 0.05ms | 0.19ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| writeFile | 0.60ms | 40ms | PASS |
| readFile | 0.13ms | 20ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| writeFile | 4048 B | -103048 B | 102400 B | yes | PASS |
| readFile | 6424 B | -125179 B | 102400 B | yes | PASS |

## Detailed serial reports

### writeFile

# Perf Report — writeFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.10ms |
| p50 | 0.12ms |
| p95 | 0.23ms |
| p99 | 0.37ms |
| mean | 0.14ms |
| stdev | 0.05ms |
| min | 0.09ms |
| max | 0.44ms |
| total | 13.99ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.10ms | 0.11ms | -0.0060ms | -5.48% |
| p50 | 0.12ms | 0.16ms | -0.04ms | -26.18% |
| p95 | 0.23ms | 0.26ms | -0.02ms | -9.69% |
| p99 | 0.37ms | 0.29ms | +0.08ms | +27.16% |
| mean | 0.14ms | 0.17ms | -0.03ms | -15.60% |
| min | 0.09ms | 0.10ms | -0.0064ms | -6.29% |
| max | 0.44ms | 0.32ms | +0.12ms | +38.60% |
| total | 13.99ms | 16.58ms | -2.59ms | -15.60% |

### readFile

# Perf Report — readFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.07ms |
| p95 | 0.19ms |
| p99 | 0.25ms |
| mean | 0.09ms |
| stdev | 0.05ms |
| min | 0.04ms |
| max | 0.31ms |
| total | 8.89ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | +0.00018ms | +0.36% |
| p50 | 0.07ms | 0.07ms | +0.0041ms | +5.84% |
| p95 | 0.19ms | 0.50ms | -0.30ms | -60.89% |
| p99 | 0.25ms | 2.30ms | -2.04ms | -89.03% |
| mean | 0.09ms | 0.26ms | -0.17ms | -65.96% |
| min | 0.04ms | 0.04ms | -0.0022ms | -4.88% |
| max | 0.31ms | 10.04ms | -9.74ms | -96.95% |
| total | 8.89ms | 26.13ms | -17.24ms | -65.96% |

