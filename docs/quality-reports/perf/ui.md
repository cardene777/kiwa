# Perf Suite — ui

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| setupComponentEnvSnapshot | 0.56ms | 30ms | PASS | stable |
| setupComponentEnvRender | 0.15ms | 30ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| setupComponentEnvSnapshot | 2.49ms | 60ms | PASS |
| setupComponentEnvRender | 1.20ms | 60ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| setupComponentEnvSnapshot | 12137848 B | -16055 B | 102400 B | PASS |
| setupComponentEnvRender | 10977240 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### setupComponentEnvSnapshot

# Perf Report — setupComponentEnvSnapshot.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p50 | 0.22ms |
| p95 | 0.56ms |
| p99 | 0.64ms |
| mean | 0.26ms |
| stdev | 0.10ms |
| min | 0.18ms |
| max | 0.64ms |
| total | 12.79ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.22ms | 0.21ms | +0.01ms | +6.03% |
| p95 | 0.56ms | 0.56ms | -0.00ms | -0.45% |
| p99 | 0.64ms | 0.62ms | +0.02ms | +3.33% |
| mean | 0.26ms | 0.25ms | +0.01ms | +2.61% |
| min | 0.18ms | 0.17ms | +0.01ms | +7.99% |
| max | 0.64ms | 0.62ms | +0.02ms | +3.33% |
| total | 12.79ms | 12.46ms | +0.32ms | +2.61% |

### setupComponentEnvRender

# Perf Report — setupComponentEnvRender.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p50 | 0.12ms |
| p95 | 0.15ms |
| p99 | 0.26ms |
| mean | 0.13ms |
| stdev | 0.02ms |
| min | 0.11ms |
| max | 0.26ms |
| total | 6.45ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.12ms | 0.13ms | -0.00ms | -2.89% |
| p95 | 0.15ms | 0.27ms | -0.11ms | -42.29% |
| p99 | 0.26ms | 1.10ms | -0.83ms | -75.98% |
| mean | 0.13ms | 0.16ms | -0.03ms | -20.84% |
| min | 0.11ms | 0.10ms | +0.01ms | +10.61% |
| max | 0.26ms | 1.10ms | -0.83ms | -75.98% |
| total | 6.45ms | 8.14ms | -1.70ms | -20.84% |

