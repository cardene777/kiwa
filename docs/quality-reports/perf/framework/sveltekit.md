# Perf Suite — sveltekit

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeLoad | 0.00ms | 5ms | PASS | stable |
| invokeAction | 0.03ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeLoad | 0.02ms | 10ms | PASS |
| invokeAction | 0.28ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeLoad | -6552 B | 0 B | 102400 B | yes | PASS |
| invokeAction | -94832 B | -54188 B | 102400 B | yes | PASS |

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
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +11.86% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +25.90% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +17.32% |
| mean | 0.00ms | 0.00ms | +0.00ms | +13.76% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.02ms | +0.01ms | +39.32% |
| total | 0.24ms | 0.21ms | +0.03ms | +13.76% |

### invokeAction

# Perf Report — invokeAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.08ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.11ms |
| total | 2.90ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +0.57% |
| p95 | 0.03ms | 0.03ms | +0.00ms | +3.62% |
| p99 | 0.08ms | 0.06ms | +0.02ms | +42.52% |
| mean | 0.01ms | 0.01ms | +0.00ms | +1.96% |
| min | 0.01ms | 0.01ms | +0.00ms | +1.66% |
| max | 0.11ms | 0.10ms | +0.01ms | +8.22% |
| total | 2.90ms | 2.84ms | +0.06ms | +1.96% |

