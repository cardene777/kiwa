# Perf Suite — sveltekit

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeLoad | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +19438%) 以上の悪化が必要) |
| invokeAction | 0.04ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +1664%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeLoad | 0.02ms | 10ms | PASS |
| invokeAction | 0.26ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeLoad | -15712 B | 0 B | 102400 B | yes | PASS |
| invokeAction | -97160 B | -50426 B | 102400 B | yes | PASS |

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
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -10.37% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -0.86% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -1.06% |
| mean | 0.00ms | 0.00ms | -0.00ms | -4.57% |
| min | 0.00ms | 0.00ms | -0.00ms | -11.72% |
| max | 0.02ms | 0.02ms | +0.00ms | +4.53% |
| total | 0.22ms | 0.23ms | -0.01ms | -4.57% |

### invokeAction

# Perf Report — invokeAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.04ms |
| p99 | 0.10ms |
| mean | 0.02ms |
| stdev | 0.03ms |
| min | 0.01ms |
| max | 0.33ms |
| total | 3.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -5.76% |
| p95 | 0.04ms | 0.03ms | +0.01ms | +41.89% |
| p99 | 0.10ms | 0.07ms | +0.03ms | +33.82% |
| mean | 0.02ms | 0.02ms | +0.00ms | +10.16% |
| min | 0.01ms | 0.01ms | -0.00ms | -6.10% |
| max | 0.33ms | 0.12ms | +0.22ms | +186.95% |
| total | 3.55ms | 3.22ms | +0.33ms | +10.16% |

