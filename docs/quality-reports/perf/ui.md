# Perf Suite — ui

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| setupComponentEnvSnapshot | 0.22ms | 0.82ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| setupComponentEnvRender | 0.17ms | 0.27ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| setupComponentEnvSnapshot | 4.04ms | 60ms | PASS |
| setupComponentEnvRender | 0.65ms | 60ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| setupComponentEnvSnapshot | 57136 B | 0 B | 102400 B | yes | PASS |
| setupComponentEnvRender | 55792 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### setupComponentEnvSnapshot

# Perf Report — setupComponentEnvSnapshot.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.22ms |
| p50 | 0.25ms |
| p95 | 0.82ms |
| p99 | 1.50ms |
| mean | 0.36ms |
| stdev | 0.28ms |
| min | 0.19ms |
| max | 1.64ms |
| total | 17.92ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.22ms | 0.20ms | +0.02ms | +10.50% |
| p50 | 0.25ms | 0.23ms | +0.02ms | +7.81% |
| p95 | 0.82ms | 3.20ms | -2.39ms | -74.50% |
| p99 | 1.50ms | 33.00ms | -31.51ms | -95.47% |
| mean | 0.36ms | 1.67ms | -1.31ms | -78.57% |
| min | 0.19ms | 0.19ms | +0.0040ms | +2.10% |
| max | 1.64ms | 39.97ms | -38.34ms | -95.91% |
| total | 17.92ms | 83.65ms | -65.73ms | -78.57% |

### setupComponentEnvRender

# Perf Report — setupComponentEnvRender.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.17ms |
| p50 | 0.20ms |
| p95 | 0.27ms |
| p99 | 1.22ms |
| mean | 0.24ms |
| stdev | 0.27ms |
| min | 0.16ms |
| max | 2.09ms |
| total | 11.95ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.17ms | 0.15ms | +0.02ms | +13.97% |
| p50 | 0.20ms | 0.17ms | +0.03ms | +17.19% |
| p95 | 0.27ms | 3.10ms | -2.83ms | -91.33% |
| p99 | 1.22ms | 4.03ms | -2.82ms | -69.84% |
| mean | 0.24ms | 0.53ms | -0.29ms | -54.80% |
| min | 0.16ms | 0.14ms | +0.01ms | +8.57% |
| max | 2.09ms | 4.51ms | -2.42ms | -53.67% |
| total | 11.95ms | 26.45ms | -14.49ms | -54.80% |

