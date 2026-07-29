# Perf Suite — ui

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| setupComponentEnvSnapshot | 0.18ms | 0.56ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| setupComponentEnvRender | 0.15ms | 0.29ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| setupComponentEnvSnapshot | 2.13ms | 60ms | PASS |
| setupComponentEnvRender | 0.63ms | 60ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| setupComponentEnvSnapshot | 273008 B | 0 B | 102400 B | yes | PASS |
| setupComponentEnvRender | 14144 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### setupComponentEnvSnapshot

# Perf Report — setupComponentEnvSnapshot.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.18ms |
| p50 | 0.21ms |
| p95 | 0.56ms |
| p99 | 0.70ms |
| mean | 0.25ms |
| stdev | 0.12ms |
| min | 0.18ms |
| max | 0.74ms |
| total | 12.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.18ms | 0.20ms | -0.02ms | -9.53% |
| p50 | 0.21ms | 0.23ms | -0.02ms | -9.29% |
| p95 | 0.56ms | 3.20ms | -2.64ms | -82.44% |
| p99 | 0.70ms | 33.00ms | -32.30ms | -97.87% |
| mean | 0.25ms | 1.67ms | -1.42ms | -84.89% |
| min | 0.18ms | 0.19ms | -0.01ms | -6.94% |
| max | 0.74ms | 39.97ms | -39.23ms | -98.16% |
| total | 12.64ms | 83.65ms | -71.01ms | -84.89% |

### setupComponentEnvRender

# Perf Report — setupComponentEnvRender.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.15ms |
| p50 | 0.17ms |
| p95 | 0.29ms |
| p99 | 0.57ms |
| mean | 0.20ms |
| stdev | 0.10ms |
| min | 0.15ms |
| max | 0.81ms |
| total | 9.77ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.15ms | 0.15ms | +0.00029ms | +0.19% |
| p50 | 0.17ms | 0.17ms | +0.0065ms | +3.89% |
| p95 | 0.29ms | 3.10ms | -2.80ms | -90.49% |
| p99 | 0.57ms | 4.03ms | -3.46ms | -85.87% |
| mean | 0.20ms | 0.53ms | -0.33ms | -63.05% |
| min | 0.15ms | 0.14ms | +0.00092ms | +0.63% |
| max | 0.81ms | 4.51ms | -3.70ms | -81.99% |
| total | 9.77ms | 26.45ms | -16.67ms | -63.05% |

