# Perf Suite — ui

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| setupComponentEnvSnapshot | 0.20ms | 0.53ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| setupComponentEnvRender | 0.15ms | 0.28ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| setupComponentEnvSnapshot | 2.04ms | 60ms | PASS |
| setupComponentEnvRender | 0.84ms | 60ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| setupComponentEnvSnapshot | -338016 B | 0 B | 102400 B | yes | PASS |
| setupComponentEnvRender | -31968 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### setupComponentEnvSnapshot

# Perf Report — setupComponentEnvSnapshot.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.20ms |
| p50 | 0.23ms |
| p95 | 0.53ms |
| p99 | 0.64ms |
| mean | 0.28ms |
| stdev | 0.11ms |
| min | 0.18ms |
| max | 0.68ms |
| total | 13.77ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.20ms | 0.20ms | -0.0054ms | -2.67% |
| p50 | 0.23ms | 0.23ms | -0.0017ms | -0.73% |
| p95 | 0.53ms | 3.20ms | -2.67ms | -83.36% |
| p99 | 0.64ms | 33.00ms | -32.36ms | -98.05% |
| mean | 0.28ms | 1.67ms | -1.40ms | -83.54% |
| min | 0.18ms | 0.19ms | -0.0075ms | -3.98% |
| max | 0.68ms | 39.97ms | -39.29ms | -98.31% |
| total | 13.77ms | 83.65ms | -69.88ms | -83.54% |

### setupComponentEnvRender

# Perf Report — setupComponentEnvRender.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.15ms |
| p50 | 0.18ms |
| p95 | 0.28ms |
| p99 | 0.64ms |
| mean | 0.20ms |
| stdev | 0.12ms |
| min | 0.14ms |
| max | 0.97ms |
| total | 10.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.15ms | 0.15ms | -0.0021ms | -1.38% |
| p50 | 0.18ms | 0.17ms | +0.01ms | +6.54% |
| p95 | 0.28ms | 3.10ms | -2.81ms | -90.90% |
| p99 | 0.64ms | 4.03ms | -3.39ms | -84.06% |
| mean | 0.20ms | 0.53ms | -0.32ms | -61.44% |
| min | 0.14ms | 0.14ms | -0.0022ms | -1.53% |
| max | 0.97ms | 4.51ms | -3.55ms | -78.60% |
| total | 10.20ms | 26.45ms | -16.25ms | -61.44% |

