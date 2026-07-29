# Perf Suite — ui

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| setupComponentEnvSnapshot | 0.20ms | 0.52ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| setupComponentEnvRender | 0.13ms | 0.28ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| setupComponentEnvSnapshot | 4.39ms | 60ms | PASS |
| setupComponentEnvRender | 0.79ms | 60ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| setupComponentEnvSnapshot | -64952 B | 0 B | 102400 B | yes | PASS |
| setupComponentEnvRender | -74080 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### setupComponentEnvSnapshot

# Perf Report — setupComponentEnvSnapshot.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.20ms |
| p50 | 0.23ms |
| p95 | 0.52ms |
| p99 | 0.70ms |
| mean | 0.29ms |
| stdev | 0.13ms |
| min | 0.18ms |
| max | 0.86ms |
| total | 14.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.20ms | 0.20ms | -0.0063ms | -3.12% |
| p50 | 0.23ms | 0.23ms | -0.0017ms | -0.75% |
| p95 | 0.52ms | 3.20ms | -2.68ms | -83.76% |
| p99 | 0.70ms | 33.00ms | -32.31ms | -97.89% |
| mean | 0.29ms | 1.67ms | -1.39ms | -82.81% |
| min | 0.18ms | 0.19ms | -0.0096ms | -5.08% |
| max | 0.86ms | 39.97ms | -39.11ms | -97.86% |
| total | 14.38ms | 83.65ms | -69.27ms | -82.81% |

### setupComponentEnvRender

# Perf Report — setupComponentEnvRender.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.13ms |
| p50 | 0.16ms |
| p95 | 0.28ms |
| p99 | 1.19ms |
| mean | 0.21ms |
| stdev | 0.27ms |
| min | 0.12ms |
| max | 2.04ms |
| total | 10.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.13ms | 0.15ms | -0.02ms | -11.70% |
| p50 | 0.16ms | 0.17ms | -0.0032ms | -1.91% |
| p95 | 0.28ms | 3.10ms | -2.81ms | -90.91% |
| p99 | 1.19ms | 4.03ms | -2.84ms | -70.37% |
| mean | 0.21ms | 0.53ms | -0.32ms | -60.52% |
| min | 0.12ms | 0.14ms | -0.02ms | -15.32% |
| max | 2.04ms | 4.51ms | -2.48ms | -54.85% |
| total | 10.44ms | 26.45ms | -16.01ms | -60.52% |

