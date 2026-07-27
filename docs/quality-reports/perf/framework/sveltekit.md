# Perf Suite — sveltekit

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeLoad | 0.00ms | 5ms | PASS | stable |
| invokeAction | 0.03ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeLoad | 0.02ms | 10ms | PASS |
| invokeAction | 0.23ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeLoad | -2248 B | 0 B | 102400 B | yes | PASS |
| invokeAction | -13664 B | -34694 B | 102400 B | yes | PASS |

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
| max | 0.01ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +5.93% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -13.24% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -3.44% |
| mean | 0.00ms | 0.00ms | -0.00ms | -3.54% |
| min | 0.00ms | 0.00ms | +0.00ms | +6.56% |
| max | 0.01ms | 0.02ms | -0.00ms | -13.80% |
| total | 0.21ms | 0.21ms | -0.01ms | -3.54% |

### invokeAction

# Perf Report — invokeAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.12ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.21ms |
| total | 3.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +4.53% |
| p95 | 0.03ms | 0.03ms | +0.01ms | +19.52% |
| p99 | 0.12ms | 0.06ms | +0.06ms | +101.32% |
| mean | 0.02ms | 0.01ms | +0.00ms | +16.49% |
| min | 0.01ms | 0.01ms | +0.00ms | +3.31% |
| max | 0.21ms | 0.10ms | +0.11ms | +105.27% |
| total | 3.31ms | 2.84ms | +0.47ms | +16.49% |

