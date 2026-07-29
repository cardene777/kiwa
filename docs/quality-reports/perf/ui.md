# Perf Suite — ui

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| setupComponentEnvSnapshot | 0.18ms | 0.39ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| setupComponentEnvRender | 0.13ms | 0.33ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| setupComponentEnvSnapshot | 1.85ms | 60ms | PASS |
| setupComponentEnvRender | 0.90ms | 60ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| setupComponentEnvSnapshot | 167520 B | 0 B | 102400 B | yes | PASS |
| setupComponentEnvRender | -74960 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### setupComponentEnvSnapshot

# Perf Report — setupComponentEnvSnapshot.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.18ms |
| p50 | 0.21ms |
| p95 | 0.39ms |
| p99 | 0.54ms |
| mean | 0.24ms |
| stdev | 0.08ms |
| min | 0.17ms |
| max | 0.56ms |
| total | 12.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.18ms | 0.20ms | -0.02ms | -10.17% |
| p50 | 0.21ms | 0.23ms | -0.02ms | -9.20% |
| p95 | 0.39ms | 3.20ms | -2.82ms | -87.95% |
| p99 | 0.54ms | 33.00ms | -32.46ms | -98.35% |
| mean | 0.24ms | 1.67ms | -1.43ms | -85.44% |
| min | 0.17ms | 0.19ms | -0.02ms | -11.11% |
| max | 0.56ms | 39.97ms | -39.41ms | -98.60% |
| total | 12.18ms | 83.65ms | -71.47ms | -85.44% |

### setupComponentEnvRender

# Perf Report — setupComponentEnvRender.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.13ms |
| p50 | 0.17ms |
| p95 | 0.33ms |
| p99 | 0.73ms |
| mean | 0.20ms |
| stdev | 0.14ms |
| min | 0.12ms |
| max | 1.08ms |
| total | 9.93ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.13ms | 0.15ms | -0.02ms | -13.39% |
| p50 | 0.17ms | 0.17ms | +0.0053ms | +3.14% |
| p95 | 0.33ms | 3.10ms | -2.76ms | -89.22% |
| p99 | 0.73ms | 4.03ms | -3.30ms | -81.80% |
| mean | 0.20ms | 0.53ms | -0.33ms | -62.44% |
| min | 0.12ms | 0.14ms | -0.02ms | -16.15% |
| max | 1.08ms | 4.51ms | -3.43ms | -76.02% |
| total | 9.93ms | 26.45ms | -16.52ms | -62.44% |

