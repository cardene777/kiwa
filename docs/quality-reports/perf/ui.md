# Perf Suite — ui

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限はこの 2 倍 = 0.00033ms。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | gate | regression |
|---|---|---|---|---|---|
| setupComponentEnvSnapshot | 0.22ms | 0.47ms | 30ms | PASS | stable — gate 無効 (regressionGate=false) |
| setupComponentEnvRender | 0.16ms | 0.69ms | 30ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| setupComponentEnvSnapshot | 4.99ms | 60ms | PASS |
| setupComponentEnvRender | 1.71ms | 60ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| setupComponentEnvSnapshot | -74640 B | 0 B | 102400 B | yes | PASS |
| setupComponentEnvRender | -33048 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### setupComponentEnvSnapshot

# Perf Report — setupComponentEnvSnapshot.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.22ms |
| p50 | 0.25ms |
| p95 | 0.47ms |
| p99 | 0.60ms |
| mean | 0.28ms |
| stdev | 0.09ms |
| min | 0.19ms |
| max | 0.61ms |
| total | 13.97ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.22ms | 0.20ms | +0.02ms | +8.22% |
| p50 | 0.25ms | 0.23ms | +0.01ms | +4.92% |
| p95 | 0.47ms | 3.20ms | -2.73ms | -85.36% |
| p99 | 0.60ms | 33.00ms | -32.41ms | -98.19% |
| mean | 0.28ms | 1.67ms | -1.39ms | -83.30% |
| min | 0.19ms | 0.19ms | +0.0029ms | +1.55% |
| max | 0.61ms | 39.97ms | -39.37ms | -98.49% |
| total | 13.97ms | 83.65ms | -69.68ms | -83.30% |

### setupComponentEnvRender

# Perf Report — setupComponentEnvRender.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.16ms |
| p50 | 0.19ms |
| p95 | 0.69ms |
| p99 | 1.22ms |
| mean | 0.28ms |
| stdev | 0.24ms |
| min | 0.15ms |
| max | 1.61ms |
| total | 13.91ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.16ms | 0.15ms | +0.0080ms | +5.30% |
| p50 | 0.19ms | 0.17ms | +0.02ms | +13.95% |
| p95 | 0.69ms | 3.10ms | -2.40ms | -77.59% |
| p99 | 1.22ms | 4.03ms | -2.81ms | -69.62% |
| mean | 0.28ms | 0.53ms | -0.25ms | -47.42% |
| min | 0.15ms | 0.14ms | +0.0010ms | +0.69% |
| max | 1.61ms | 4.51ms | -2.91ms | -64.39% |
| total | 13.91ms | 26.45ms | -12.54ms | -47.42% |

