# Perf Suite — ui

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| setupComponentEnvSnapshot | 0.21ms | 0.49ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| setupComponentEnvRender | 0.15ms | 0.31ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| setupComponentEnvSnapshot | 2.47ms | 60ms | PASS |
| setupComponentEnvRender | 0.71ms | 60ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| setupComponentEnvSnapshot | 62000 B | 0 B | 102400 B | yes | PASS |
| setupComponentEnvRender | 14040 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### setupComponentEnvSnapshot

# Perf Report — setupComponentEnvSnapshot.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.21ms |
| p50 | 0.24ms |
| p95 | 0.49ms |
| p99 | 0.59ms |
| mean | 0.28ms |
| stdev | 0.10ms |
| min | 0.20ms |
| max | 0.65ms |
| total | 13.79ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.21ms | 0.20ms | +0.0047ms | +2.32% |
| p50 | 0.24ms | 0.23ms | +0.0041ms | +1.76% |
| p95 | 0.49ms | 3.20ms | -2.72ms | -84.85% |
| p99 | 0.59ms | 33.00ms | -32.41ms | -98.21% |
| mean | 0.28ms | 1.67ms | -1.40ms | -83.52% |
| min | 0.20ms | 0.19ms | +0.0083ms | +4.38% |
| max | 0.65ms | 39.97ms | -39.32ms | -98.38% |
| total | 13.79ms | 83.65ms | -69.86ms | -83.52% |

### setupComponentEnvRender

# Perf Report — setupComponentEnvRender.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.15ms |
| p50 | 0.18ms |
| p95 | 0.31ms |
| p99 | 0.69ms |
| mean | 0.21ms |
| stdev | 0.11ms |
| min | 0.14ms |
| max | 0.86ms |
| total | 10.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.15ms | 0.15ms | -0.0018ms | -1.16% |
| p50 | 0.18ms | 0.17ms | +0.02ms | +9.31% |
| p95 | 0.31ms | 3.10ms | -2.79ms | -90.04% |
| p99 | 0.69ms | 4.03ms | -3.35ms | -83.01% |
| mean | 0.21ms | 0.53ms | -0.32ms | -60.14% |
| min | 0.14ms | 0.14ms | -0.0010ms | -0.72% |
| max | 0.86ms | 4.51ms | -3.65ms | -80.93% |
| total | 10.54ms | 26.45ms | -15.91ms | -60.14% |

