# Perf Suite — ui

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| setupComponentEnvSnapshot | 0.19ms | 0.57ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| setupComponentEnvRender | 0.12ms | 0.32ms | 30ms | 0.00033ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| setupComponentEnvSnapshot | 1.11ms | 60ms | PASS |
| setupComponentEnvRender | 0.70ms | 60ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| setupComponentEnvSnapshot | -59952 B | 0 B | 102400 B | yes | PASS |
| setupComponentEnvRender | -74928 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### setupComponentEnvSnapshot

# Perf Report — setupComponentEnvSnapshot.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.19ms |
| p50 | 0.23ms |
| p95 | 0.57ms |
| p99 | 0.72ms |
| mean | 0.29ms |
| stdev | 0.14ms |
| min | 0.17ms |
| max | 0.85ms |
| total | 14.68ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.19ms | 0.20ms | -0.0099ms | -4.88% |
| p50 | 0.23ms | 0.23ms | -0.0036ms | -1.52% |
| p95 | 0.57ms | 3.20ms | -2.63ms | -82.26% |
| p99 | 0.72ms | 33.00ms | -32.28ms | -97.81% |
| mean | 0.29ms | 1.67ms | -1.38ms | -82.45% |
| min | 0.17ms | 0.19ms | -0.02ms | -12.17% |
| max | 0.85ms | 39.97ms | -39.12ms | -97.87% |
| total | 14.68ms | 83.65ms | -68.97ms | -82.45% |

### setupComponentEnvRender

# Perf Report — setupComponentEnvRender.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.12ms |
| p50 | 0.16ms |
| p95 | 0.32ms |
| p99 | 0.55ms |
| mean | 0.19ms |
| stdev | 0.10ms |
| min | 0.12ms |
| max | 0.69ms |
| total | 9.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.12ms | 0.15ms | -0.03ms | -21.94% |
| p50 | 0.16ms | 0.17ms | -0.0095ms | -5.64% |
| p95 | 0.32ms | 3.10ms | -2.77ms | -89.55% |
| p99 | 0.55ms | 4.03ms | -3.48ms | -86.25% |
| mean | 0.19ms | 0.53ms | -0.34ms | -64.87% |
| min | 0.12ms | 0.14ms | -0.03ms | -19.70% |
| max | 0.69ms | 4.51ms | -3.83ms | -84.79% |
| total | 9.29ms | 26.45ms | -17.16ms | -64.87% |

