# Perf Suite — ui

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| setupComponentEnvSnapshot | 0.19ms | 0.53ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| setupComponentEnvRender | 0.14ms | 0.39ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| setupComponentEnvSnapshot | 2.57ms | 60ms | PASS |
| setupComponentEnvRender | 0.73ms | 60ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| setupComponentEnvSnapshot | -85256 B | 0 B | 102400 B | yes | PASS |
| setupComponentEnvRender | -38592 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### setupComponentEnvSnapshot

# Perf Report — setupComponentEnvSnapshot.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.19ms |
| p50 | 0.24ms |
| p95 | 0.53ms |
| p99 | 0.73ms |
| mean | 0.28ms |
| stdev | 0.12ms |
| min | 0.17ms |
| max | 0.82ms |
| total | 13.78ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.19ms | 0.20ms | -0.01ms | -5.39% |
| p50 | 0.24ms | 0.23ms | +0.0038ms | +1.61% |
| p95 | 0.53ms | 3.20ms | -2.67ms | -83.38% |
| p99 | 0.73ms | 33.00ms | -32.27ms | -97.79% |
| mean | 0.28ms | 1.67ms | -1.40ms | -83.52% |
| min | 0.17ms | 0.19ms | -0.02ms | -8.22% |
| max | 0.82ms | 39.97ms | -39.15ms | -97.95% |
| total | 13.78ms | 83.65ms | -69.87ms | -83.52% |

### setupComponentEnvRender

# Perf Report — setupComponentEnvRender.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.14ms |
| p50 | 0.21ms |
| p95 | 0.39ms |
| p99 | 1.13ms |
| mean | 0.24ms |
| stdev | 0.24ms |
| min | 0.13ms |
| max | 1.80ms |
| total | 12.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.14ms | 0.15ms | -0.01ms | -9.49% |
| p50 | 0.21ms | 0.17ms | +0.04ms | +24.53% |
| p95 | 0.39ms | 3.10ms | -2.70ms | -87.32% |
| p99 | 1.13ms | 4.03ms | -2.90ms | -71.88% |
| mean | 0.24ms | 0.53ms | -0.29ms | -54.00% |
| min | 0.13ms | 0.14ms | -0.02ms | -10.50% |
| max | 1.80ms | 4.51ms | -2.71ms | -60.06% |
| total | 12.17ms | 26.45ms | -14.28ms | -54.00% |

