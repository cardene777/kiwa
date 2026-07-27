# Perf Suite — ui

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| setupComponentEnvSnapshot | 1.46ms | 30ms | PASS | stable |
| setupComponentEnvRender | 0.30ms | 30ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| setupComponentEnvSnapshot | 6.25ms | 60ms | PASS |
| setupComponentEnvRender | 0.88ms | 60ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| setupComponentEnvSnapshot | 11378824 B | 0 B | 102400 B | PASS |
| setupComponentEnvRender | 10985008 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### setupComponentEnvSnapshot

# Perf Report — setupComponentEnvSnapshot.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p50 | 0.28ms |
| p95 | 1.46ms |
| p99 | 2.53ms |
| mean | 0.45ms |
| stdev | 0.51ms |
| min | 0.21ms |
| max | 3.02ms |
| total | 22.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.28ms | 0.21ms | +0.06ms | +30.68% |
| p95 | 1.46ms | 0.56ms | +0.89ms | +157.92% |
| p99 | 2.53ms | 0.62ms | +1.91ms | +308.74% |
| mean | 0.45ms | 0.25ms | +0.20ms | +79.62% |
| min | 0.21ms | 0.17ms | +0.04ms | +25.60% |
| max | 3.02ms | 0.62ms | +2.40ms | +389.27% |
| total | 22.38ms | 12.46ms | +9.92ms | +79.62% |

### setupComponentEnvRender

# Perf Report — setupComponentEnvRender.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p50 | 0.13ms |
| p95 | 0.30ms |
| p99 | 0.50ms |
| mean | 0.15ms |
| stdev | 0.09ms |
| min | 0.10ms |
| max | 0.65ms |
| total | 7.65ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.13ms | 0.13ms | +0.00ms | +1.19% |
| p95 | 0.30ms | 0.27ms | +0.03ms | +12.93% |
| p99 | 0.50ms | 1.10ms | -0.59ms | -54.12% |
| mean | 0.15ms | 0.16ms | -0.01ms | -6.09% |
| min | 0.10ms | 0.10ms | -0.00ms | -2.77% |
| max | 0.65ms | 1.10ms | -0.45ms | -41.01% |
| total | 7.65ms | 8.14ms | -0.50ms | -6.09% |

