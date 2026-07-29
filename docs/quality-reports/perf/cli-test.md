# Perf Suite — cli-test

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| writeFile | 0.11ms | 0.17ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| readFile | 0.05ms | 0.20ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| writeFile | 0.28ms | 40ms | PASS |
| readFile | 0.18ms | 20ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| writeFile | 2968 B | -32048 B | 102400 B | yes | PASS |
| readFile | 6392 B | 6655 B | 102400 B | yes | PASS |

## Detailed serial reports

### writeFile

# Perf Report — writeFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.11ms |
| p50 | 0.13ms |
| p95 | 0.17ms |
| p99 | 0.21ms |
| mean | 0.14ms |
| stdev | 0.02ms |
| min | 0.10ms |
| max | 0.23ms |
| total | 13.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.11ms | 0.11ms | +0.0025ms | +2.30% |
| p50 | 0.13ms | 0.16ms | -0.03ms | -20.24% |
| p95 | 0.17ms | 0.26ms | -0.08ms | -32.32% |
| p99 | 0.21ms | 0.29ms | -0.09ms | -29.76% |
| mean | 0.14ms | 0.17ms | -0.03ms | -17.94% |
| min | 0.10ms | 0.10ms | -0.0048ms | -4.77% |
| max | 0.23ms | 0.32ms | -0.09ms | -27.39% |
| total | 13.61ms | 16.58ms | -2.97ms | -17.94% |

### readFile

# Perf Report — readFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.07ms |
| p95 | 0.20ms |
| p99 | 0.22ms |
| mean | 0.08ms |
| stdev | 0.04ms |
| min | 0.05ms |
| max | 0.30ms |
| total | 8.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.000083ms | -0.17% |
| p50 | 0.07ms | 0.07ms | +0.0014ms | +2.03% |
| p95 | 0.20ms | 0.50ms | -0.30ms | -60.60% |
| p99 | 0.22ms | 2.30ms | -2.08ms | -90.41% |
| mean | 0.08ms | 0.26ms | -0.18ms | -68.42% |
| min | 0.05ms | 0.04ms | +0.0021ms | +4.70% |
| max | 0.30ms | 10.04ms | -9.74ms | -96.98% |
| total | 8.25ms | 26.13ms | -17.88ms | -68.42% |

