# Perf Suite — ui

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| setupComponentEnvSnapshot | 0.20ms | 0.63ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| setupComponentEnvRender | 0.13ms | 0.33ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| setupComponentEnvSnapshot | 0.72ms | 60ms | PASS |
| setupComponentEnvRender | 0.58ms | 60ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| setupComponentEnvSnapshot | 158352 B | 0 B | 102400 B | yes | PASS |
| setupComponentEnvRender | -72416 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### setupComponentEnvSnapshot

# Perf Report — setupComponentEnvSnapshot.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.20ms |
| p50 | 0.25ms |
| p95 | 0.63ms |
| p99 | 1.92ms |
| mean | 0.35ms |
| stdev | 0.39ms |
| min | 0.19ms |
| max | 2.84ms |
| total | 17.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.20ms | 0.20ms | -0.0051ms | -2.50% |
| p50 | 0.25ms | 0.23ms | +0.01ms | +5.79% |
| p95 | 0.63ms | 3.20ms | -2.57ms | -80.27% |
| p99 | 1.92ms | 33.00ms | -31.08ms | -94.18% |
| mean | 0.35ms | 1.67ms | -1.32ms | -79.07% |
| min | 0.19ms | 0.19ms | -0.0017ms | -0.88% |
| max | 2.84ms | 39.97ms | -37.13ms | -92.90% |
| total | 17.51ms | 83.65ms | -66.14ms | -79.07% |

### setupComponentEnvRender

# Perf Report — setupComponentEnvRender.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.13ms |
| p50 | 0.16ms |
| p95 | 0.33ms |
| p99 | 1.65ms |
| mean | 0.23ms |
| stdev | 0.34ms |
| min | 0.12ms |
| max | 2.49ms |
| total | 11.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.13ms | 0.15ms | -0.02ms | -13.27% |
| p50 | 0.16ms | 0.17ms | -0.0072ms | -4.31% |
| p95 | 0.33ms | 3.10ms | -2.77ms | -89.31% |
| p99 | 1.65ms | 4.03ms | -2.38ms | -58.97% |
| mean | 0.23ms | 0.53ms | -0.30ms | -56.08% |
| min | 0.12ms | 0.14ms | -0.03ms | -18.52% |
| max | 2.49ms | 4.51ms | -2.03ms | -44.89% |
| total | 11.62ms | 26.45ms | -14.83ms | -56.08% |

