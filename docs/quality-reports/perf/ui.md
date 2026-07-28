# Perf Suite — ui

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| setupComponentEnvSnapshot | 0.46ms | 30ms | PASS | stable |
| setupComponentEnvRender | 0.24ms | 30ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| setupComponentEnvSnapshot | 4.48ms | 60ms | PASS |
| setupComponentEnvRender | 1.03ms | 60ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| setupComponentEnvSnapshot | -57112 B | 0 B | 102400 B | yes | PASS |
| setupComponentEnvRender | 63328 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### setupComponentEnvSnapshot

# Perf Report — setupComponentEnvSnapshot.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p50 | 0.21ms |
| p95 | 0.46ms |
| p99 | 1.66ms |
| mean | 0.29ms |
| stdev | 0.34ms |
| min | 0.17ms |
| max | 2.52ms |
| total | 14.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.21ms | 0.22ms | -0.01ms | -2.60% |
| p95 | 0.46ms | 0.45ms | +0.01ms | +1.93% |
| p99 | 1.66ms | 0.54ms | +1.12ms | +208.05% |
| mean | 0.29ms | 0.25ms | +0.04ms | +15.81% |
| min | 0.17ms | 0.17ms | +0.00ms | +0.22% |
| max | 2.52ms | 0.54ms | +1.98ms | +365.34% |
| total | 14.29ms | 12.34ms | +1.95ms | +15.81% |

### setupComponentEnvRender

# Perf Report — setupComponentEnvRender.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p50 | 0.18ms |
| p95 | 0.24ms |
| p99 | 0.96ms |
| mean | 0.20ms |
| stdev | 0.18ms |
| min | 0.12ms |
| max | 1.33ms |
| total | 9.87ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.18ms | 0.18ms | -0.01ms | -2.95% |
| p95 | 0.24ms | 0.30ms | -0.06ms | -19.40% |
| p99 | 0.96ms | 0.73ms | +0.23ms | +31.68% |
| mean | 0.20ms | 0.21ms | -0.01ms | -4.93% |
| min | 0.12ms | 0.16ms | -0.04ms | -22.88% |
| max | 1.33ms | 1.07ms | +0.26ms | +24.17% |
| total | 9.87ms | 10.39ms | -0.51ms | -4.93% |

