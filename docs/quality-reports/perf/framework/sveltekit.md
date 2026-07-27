# Perf Suite — sveltekit

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeLoad | 0.00ms | 5ms | PASS | stable |
| invokeAction | 0.04ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeLoad | 0.02ms | 10ms | PASS |
| invokeAction | 0.30ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeLoad | -4440 B | 0 B | 102400 B | yes | PASS |
| invokeAction | -94832 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeLoad

# Perf Report — invokeLoad.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +29.38% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -8.09% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +31.85% |
| mean | 0.00ms | 0.00ms | +0.00ms | +17.18% |
| min | 0.00ms | 0.00ms | +0.00ms | +20.00% |
| max | 0.02ms | 0.02ms | +0.01ms | +31.25% |
| total | 0.25ms | 0.21ms | +0.04ms | +17.18% |

### invokeAction

# Perf Report — invokeAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.04ms |
| p99 | 0.07ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.12ms |
| total | 3.75ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +23.77% |
| p95 | 0.04ms | 0.03ms | +0.01ms | +36.53% |
| p99 | 0.07ms | 0.06ms | +0.01ms | +24.53% |
| mean | 0.02ms | 0.01ms | +0.00ms | +32.14% |
| min | 0.01ms | 0.01ms | +0.00ms | +19.01% |
| max | 0.12ms | 0.10ms | +0.02ms | +20.01% |
| total | 3.75ms | 2.84ms | +0.91ms | +32.14% |

