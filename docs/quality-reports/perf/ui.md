# Perf Suite — ui

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00020ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00041ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| setupComponentEnvSnapshot | 0.19ms | 0.43ms | 30ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |
| setupComponentEnvRender | 0.17ms | 0.40ms | 30ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| setupComponentEnvSnapshot | 3.15ms | 60ms | PASS |
| setupComponentEnvRender | 0.65ms | 60ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| setupComponentEnvSnapshot | 43720 B | 0 B | 102400 B | yes | PASS |
| setupComponentEnvRender | 17736 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### setupComponentEnvSnapshot

# Perf Report — setupComponentEnvSnapshot.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.19ms |
| p50 | 0.22ms |
| p95 | 0.43ms |
| p99 | 0.75ms |
| mean | 0.26ms |
| stdev | 0.12ms |
| min | 0.18ms |
| max | 0.82ms |
| total | 12.88ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.19ms | 0.20ms | -0.01ms | -6.47% |
| p50 | 0.22ms | 0.23ms | -0.02ms | -6.74% |
| p95 | 0.43ms | 3.20ms | -2.77ms | -86.57% |
| p99 | 0.75ms | 33.00ms | -32.25ms | -97.74% |
| mean | 0.26ms | 1.67ms | -1.42ms | -84.60% |
| min | 0.18ms | 0.19ms | -0.01ms | -5.68% |
| max | 0.82ms | 39.97ms | -39.15ms | -97.95% |
| total | 12.88ms | 83.65ms | -70.77ms | -84.60% |

### setupComponentEnvRender

# Perf Report — setupComponentEnvRender.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.17ms |
| p50 | 0.19ms |
| p95 | 0.40ms |
| p99 | 0.68ms |
| mean | 0.23ms |
| stdev | 0.11ms |
| min | 0.15ms |
| max | 0.87ms |
| total | 11.67ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.17ms | 0.15ms | +0.02ms | +13.24% |
| p50 | 0.19ms | 0.17ms | +0.03ms | +14.87% |
| p95 | 0.40ms | 3.10ms | -2.70ms | -87.19% |
| p99 | 0.68ms | 4.03ms | -3.35ms | -83.17% |
| mean | 0.23ms | 0.53ms | -0.30ms | -55.86% |
| min | 0.15ms | 0.14ms | +0.0097ms | +6.69% |
| max | 0.87ms | 4.51ms | -3.64ms | -80.70% |
| total | 11.67ms | 26.45ms | -14.77ms | -55.86% |

