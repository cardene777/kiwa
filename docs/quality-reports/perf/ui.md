# Perf Suite — ui

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| setupComponentEnvSnapshot | 0.21ms | 0.55ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| setupComponentEnvRender | 0.15ms | 2.99ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| setupComponentEnvSnapshot | 4.49ms | 60ms | PASS |
| setupComponentEnvRender | 5.52ms | 60ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| setupComponentEnvSnapshot | -75840 B | 0 B | 102400 B | yes | PASS |
| setupComponentEnvRender | -9880 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### setupComponentEnvSnapshot

# Perf Report — setupComponentEnvSnapshot.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.21ms |
| p50 | 0.24ms |
| p95 | 0.55ms |
| p99 | 0.67ms |
| mean | 0.28ms |
| stdev | 0.12ms |
| min | 0.19ms |
| max | 0.70ms |
| total | 14.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.21ms | 0.20ms | +0.0068ms | +3.36% |
| p50 | 0.24ms | 0.23ms | +0.0056ms | +2.41% |
| p95 | 0.55ms | 3.20ms | -2.65ms | -82.67% |
| p99 | 0.67ms | 33.00ms | -32.33ms | -97.96% |
| mean | 0.28ms | 1.67ms | -1.39ms | -83.07% |
| min | 0.19ms | 0.19ms | +0.0036ms | +1.92% |
| max | 0.70ms | 39.97ms | -39.27ms | -98.24% |
| total | 14.16ms | 83.65ms | -69.49ms | -83.07% |

### setupComponentEnvRender

# Perf Report — setupComponentEnvRender.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.15ms |
| p50 | 0.20ms |
| p95 | 2.99ms |
| p99 | 6.33ms |
| mean | 0.68ms |
| stdev | 1.34ms |
| min | 0.14ms |
| max | 7.51ms |
| total | 33.81ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.15ms | 0.15ms | -0.0045ms | -2.98% |
| p50 | 0.20ms | 0.17ms | +0.03ms | +19.91% |
| p95 | 2.99ms | 3.10ms | -0.10ms | -3.37% |
| p99 | 6.33ms | 4.03ms | +2.30ms | +56.95% |
| mean | 0.68ms | 0.53ms | +0.15ms | +27.84% |
| min | 0.14ms | 0.14ms | -0.0092ms | -6.37% |
| max | 7.51ms | 4.51ms | +2.99ms | +66.32% |
| total | 33.81ms | 26.45ms | +7.36ms | +27.84% |

