# Perf Suite — ui

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| setupComponentEnvSnapshot | 0.56ms | 30ms | PASS | stable |
| setupComponentEnvRender | 0.62ms | 30ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| setupComponentEnvSnapshot | 3.57ms | 60ms | PASS |
| setupComponentEnvRender | 0.70ms | 60ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| setupComponentEnvSnapshot | 118216 B | -933 B | 102400 B | yes | PASS |
| setupComponentEnvRender | 68768 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### setupComponentEnvSnapshot

# Perf Report — setupComponentEnvSnapshot.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p50 | 0.26ms |
| p95 | 0.56ms |
| p99 | 1.02ms |
| mean | 0.32ms |
| stdev | 0.18ms |
| min | 0.20ms |
| max | 1.29ms |
| total | 15.80ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.26ms | 0.22ms | +0.04ms | +16.36% |
| p95 | 0.56ms | 0.45ms | +0.11ms | +23.58% |
| p99 | 1.02ms | 0.54ms | +0.48ms | +89.73% |
| mean | 0.32ms | 0.25ms | +0.07ms | +28.01% |
| min | 0.20ms | 0.17ms | +0.03ms | +16.93% |
| max | 1.29ms | 0.54ms | +0.75ms | +137.45% |
| total | 15.80ms | 12.34ms | +3.46ms | +28.01% |

### setupComponentEnvRender

# Perf Report — setupComponentEnvRender.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p50 | 0.20ms |
| p95 | 0.62ms |
| p99 | 2.57ms |
| mean | 0.32ms |
| stdev | 0.57ms |
| min | 0.16ms |
| max | 4.19ms |
| total | 15.83ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.20ms | 0.18ms | +0.02ms | +8.72% |
| p95 | 0.62ms | 0.30ms | +0.33ms | +108.76% |
| p99 | 2.57ms | 0.73ms | +1.85ms | +254.39% |
| mean | 0.32ms | 0.21ms | +0.11ms | +52.41% |
| min | 0.16ms | 0.16ms | +0.00ms | +2.27% |
| max | 4.19ms | 1.07ms | +3.12ms | +290.51% |
| total | 15.83ms | 10.39ms | +5.44ms | +52.41% |

