# Perf Suite — ui

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| setupComponentEnvSnapshot | 0.18ms | 0.38ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| setupComponentEnvRender | 0.14ms | 0.34ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| setupComponentEnvSnapshot | 2.66ms | 60ms | PASS |
| setupComponentEnvRender | 0.80ms | 60ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| setupComponentEnvSnapshot | -62584 B | 0 B | 102400 B | yes | PASS |
| setupComponentEnvRender | -73488 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### setupComponentEnvSnapshot

# Perf Report — setupComponentEnvSnapshot.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.18ms |
| p50 | 0.21ms |
| p95 | 0.38ms |
| p99 | 0.55ms |
| mean | 0.24ms |
| stdev | 0.08ms |
| min | 0.17ms |
| max | 0.55ms |
| total | 11.85ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.18ms | 0.20ms | -0.02ms | -8.49% |
| p50 | 0.21ms | 0.23ms | -0.02ms | -9.99% |
| p95 | 0.38ms | 3.20ms | -2.82ms | -88.18% |
| p99 | 0.55ms | 33.00ms | -32.46ms | -98.35% |
| mean | 0.24ms | 1.67ms | -1.44ms | -85.84% |
| min | 0.17ms | 0.19ms | -0.02ms | -10.58% |
| max | 0.55ms | 39.97ms | -39.42ms | -98.62% |
| total | 11.85ms | 83.65ms | -71.80ms | -85.84% |

### setupComponentEnvRender

# Perf Report — setupComponentEnvRender.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.14ms |
| p50 | 0.18ms |
| p95 | 0.34ms |
| p99 | 0.71ms |
| mean | 0.21ms |
| stdev | 0.13ms |
| min | 0.13ms |
| max | 0.97ms |
| total | 10.45ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.14ms | 0.15ms | -0.0078ms | -5.15% |
| p50 | 0.18ms | 0.17ms | +0.01ms | +8.29% |
| p95 | 0.34ms | 3.10ms | -2.75ms | -88.97% |
| p99 | 0.71ms | 4.03ms | -3.32ms | -82.42% |
| mean | 0.21ms | 0.53ms | -0.32ms | -60.51% |
| min | 0.13ms | 0.14ms | -0.01ms | -8.91% |
| max | 0.97ms | 4.51ms | -3.54ms | -78.47% |
| total | 10.45ms | 26.45ms | -16.00ms | -60.51% |

