# Perf Suite — ui

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| setupComponentEnvSnapshot | 0.21ms | 0.51ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| setupComponentEnvRender | 0.12ms | 0.58ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| setupComponentEnvSnapshot | 3.56ms | 60ms | PASS |
| setupComponentEnvRender | 0.97ms | 60ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| setupComponentEnvSnapshot | 214696 B | -930 B | 102400 B | yes | PASS |
| setupComponentEnvRender | -79576 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### setupComponentEnvSnapshot

# Perf Report — setupComponentEnvSnapshot.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.21ms |
| p50 | 0.25ms |
| p95 | 0.51ms |
| p99 | 0.64ms |
| mean | 0.28ms |
| stdev | 0.10ms |
| min | 0.20ms |
| max | 0.65ms |
| total | 13.92ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.21ms | 0.20ms | +0.0057ms | +2.84% |
| p50 | 0.25ms | 0.23ms | +0.01ms | +6.35% |
| p95 | 0.51ms | 3.20ms | -2.70ms | -84.18% |
| p99 | 0.64ms | 33.00ms | -32.36ms | -98.05% |
| mean | 0.28ms | 1.67ms | -1.39ms | -83.36% |
| min | 0.20ms | 0.19ms | +0.0077ms | +4.09% |
| max | 0.65ms | 39.97ms | -39.32ms | -98.38% |
| total | 13.92ms | 83.65ms | -69.73ms | -83.36% |

### setupComponentEnvRender

# Perf Report — setupComponentEnvRender.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.12ms |
| p50 | 0.15ms |
| p95 | 0.58ms |
| p99 | 1.45ms |
| mean | 0.24ms |
| stdev | 0.31ms |
| min | 0.11ms |
| max | 2.17ms |
| total | 12.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.12ms | 0.15ms | -0.03ms | -18.26% |
| p50 | 0.15ms | 0.17ms | -0.02ms | -11.99% |
| p95 | 0.58ms | 3.10ms | -2.51ms | -81.21% |
| p99 | 1.45ms | 4.03ms | -2.59ms | -64.15% |
| mean | 0.24ms | 0.53ms | -0.29ms | -54.37% |
| min | 0.11ms | 0.14ms | -0.03ms | -22.61% |
| max | 2.17ms | 4.51ms | -2.35ms | -51.98% |
| total | 12.07ms | 26.45ms | -14.38ms | -54.37% |

