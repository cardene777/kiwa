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
| invokeLoad | 0.01ms | 10ms | PASS |
| invokeAction | 0.33ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| invokeLoad | 638056 B | 0 B | 102400 B | PASS |
| invokeAction | 3310704 B | 15200 B | 102400 B | PASS |

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
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +2.10% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +6.77% |
| mean | 0.00ms | 0.00ms | +0.00ms | +4.16% |
| min | 0.00ms | 0.00ms | +0.00ms | +7.20% |
| max | 0.01ms | 0.01ms | +0.00ms | +14.72% |
| total | 0.20ms | 0.19ms | +0.01ms | +4.16% |

### invokeAction

# Perf Report — invokeAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.07ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.11ms |
| total | 3.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +1.66% |
| p95 | 0.03ms | 0.03ms | +0.00ms | +2.28% |
| p99 | 0.07ms | 0.06ms | +0.01ms | +16.07% |
| mean | 0.02ms | 0.02ms | +0.00ms | +2.21% |
| min | 0.01ms | 0.01ms | +0.00ms | +1.93% |
| max | 0.11ms | 0.11ms | +0.00ms | +1.26% |
| total | 3.23ms | 3.16ms | +0.07ms | +2.21% |

