# Perf Suite — ui

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| setupComponentEnvSnapshot | 0.77ms | 30ms | PASS | stable |
| setupComponentEnvRender | 0.27ms | 30ms | PASS | stable (検知には +0.5ms (baseline 比 +106%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| setupComponentEnvSnapshot | 4.64ms | 60ms | PASS |
| setupComponentEnvRender | 1.17ms | 60ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| setupComponentEnvSnapshot | -63312 B | 0 B | 102400 B | yes | PASS |
| setupComponentEnvRender | -49480 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### setupComponentEnvSnapshot

# Perf Report — setupComponentEnvSnapshot.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p50 | 0.26ms |
| p95 | 0.77ms |
| p99 | 1.03ms |
| mean | 0.33ms |
| stdev | 0.19ms |
| min | 0.21ms |
| max | 1.04ms |
| total | 16.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.26ms | 0.26ms | -0.00ms | -1.12% |
| p95 | 0.77ms | 0.93ms | -0.17ms | -17.75% |
| p99 | 1.03ms | 1.44ms | -0.41ms | -28.37% |
| mean | 0.33ms | 0.39ms | -0.06ms | -15.19% |
| min | 0.21ms | 0.20ms | +0.01ms | +2.87% |
| max | 1.04ms | 1.74ms | -0.70ms | -40.40% |
| total | 16.34ms | 19.26ms | -2.93ms | -15.19% |

### setupComponentEnvRender

# Perf Report — setupComponentEnvRender.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p50 | 0.17ms |
| p95 | 0.27ms |
| p99 | 0.64ms |
| mean | 0.20ms |
| stdev | 0.11ms |
| min | 0.13ms |
| max | 0.94ms |
| total | 9.94ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.17ms | 0.18ms | -0.01ms | -3.63% |
| p95 | 0.27ms | 0.47ms | -0.20ms | -42.52% |
| p99 | 0.64ms | 0.66ms | -0.02ms | -3.26% |
| mean | 0.20ms | 0.22ms | -0.02ms | -8.22% |
| min | 0.13ms | 0.16ms | -0.03ms | -18.17% |
| max | 0.94ms | 0.73ms | +0.21ms | +28.14% |
| total | 9.94ms | 10.83ms | -0.89ms | -8.22% |

