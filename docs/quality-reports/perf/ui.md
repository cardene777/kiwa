# Perf Suite — ui

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| setupComponentEnvSnapshot | 0.35ms | 30ms | PASS | stable |
| setupComponentEnvRender | 0.35ms | 30ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| setupComponentEnvSnapshot | 3.82ms | 60ms | PASS |
| setupComponentEnvRender | 0.56ms | 60ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| setupComponentEnvSnapshot | 56928 B | 0 B | 102400 B | yes | PASS |
| setupComponentEnvRender | 66112 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### setupComponentEnvSnapshot

# Perf Report — setupComponentEnvSnapshot.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p50 | 0.22ms |
| p95 | 0.35ms |
| p99 | 0.52ms |
| mean | 0.24ms |
| stdev | 0.07ms |
| min | 0.17ms |
| max | 0.53ms |
| total | 11.91ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.22ms | 0.22ms | -0.00ms | -1.56% |
| p95 | 0.35ms | 0.45ms | -0.11ms | -23.32% |
| p99 | 0.52ms | 0.54ms | -0.02ms | -3.53% |
| mean | 0.24ms | 0.25ms | -0.01ms | -3.49% |
| min | 0.17ms | 0.17ms | -0.00ms | -1.61% |
| max | 0.53ms | 0.54ms | -0.01ms | -2.73% |
| total | 11.91ms | 12.34ms | -0.43ms | -3.49% |

### setupComponentEnvRender

# Perf Report — setupComponentEnvRender.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p50 | 0.18ms |
| p95 | 0.35ms |
| p99 | 0.61ms |
| mean | 0.21ms |
| stdev | 0.10ms |
| min | 0.15ms |
| max | 0.78ms |
| total | 10.41ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.18ms | 0.18ms | -0.00ms | -0.03% |
| p95 | 0.35ms | 0.30ms | +0.06ms | +18.66% |
| p99 | 0.61ms | 0.73ms | -0.11ms | -15.36% |
| mean | 0.21ms | 0.21ms | +0.00ms | +0.23% |
| min | 0.15ms | 0.16ms | -0.01ms | -7.09% |
| max | 0.78ms | 1.07ms | -0.29ms | -27.40% |
| total | 10.41ms | 10.39ms | +0.02ms | +0.23% |

