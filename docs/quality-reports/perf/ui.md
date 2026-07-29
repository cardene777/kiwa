# Perf Suite — ui

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| setupComponentEnvSnapshot | 0.21ms | 0.45ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| setupComponentEnvRender | 0.12ms | 0.35ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| setupComponentEnvSnapshot | 2.35ms | 60ms | PASS |
| setupComponentEnvRender | 0.63ms | 60ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| setupComponentEnvSnapshot | -71016 B | 0 B | 102400 B | yes | PASS |
| setupComponentEnvRender | -75040 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### setupComponentEnvSnapshot

# Perf Report — setupComponentEnvSnapshot.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.21ms |
| p50 | 0.25ms |
| p95 | 0.45ms |
| p99 | 0.55ms |
| mean | 0.28ms |
| stdev | 0.08ms |
| min | 0.19ms |
| max | 0.55ms |
| total | 13.78ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.21ms | 0.20ms | +0.0046ms | +2.30% |
| p50 | 0.25ms | 0.23ms | +0.02ms | +8.12% |
| p95 | 0.45ms | 3.20ms | -2.75ms | -85.94% |
| p99 | 0.55ms | 33.00ms | -32.46ms | -98.35% |
| mean | 0.28ms | 1.67ms | -1.40ms | -83.52% |
| min | 0.19ms | 0.19ms | +0.0046ms | +2.43% |
| max | 0.55ms | 39.97ms | -39.42ms | -98.63% |
| total | 13.78ms | 83.65ms | -69.87ms | -83.52% |

### setupComponentEnvRender

# Perf Report — setupComponentEnvRender.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.12ms |
| p50 | 0.15ms |
| p95 | 0.35ms |
| p99 | 0.66ms |
| mean | 0.19ms |
| stdev | 0.12ms |
| min | 0.12ms |
| max | 0.90ms |
| total | 9.69ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.12ms | 0.15ms | -0.03ms | -18.00% |
| p50 | 0.15ms | 0.17ms | -0.01ms | -8.13% |
| p95 | 0.35ms | 3.10ms | -2.75ms | -88.68% |
| p99 | 0.66ms | 4.03ms | -3.37ms | -83.71% |
| mean | 0.19ms | 0.53ms | -0.34ms | -63.34% |
| min | 0.12ms | 0.14ms | -0.03ms | -18.72% |
| max | 0.90ms | 4.51ms | -3.61ms | -80.04% |
| total | 9.69ms | 26.45ms | -16.75ms | -63.34% |

