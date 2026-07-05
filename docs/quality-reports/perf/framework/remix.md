# Perf Suite — remix

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeLoader | 0.01ms | 5ms | PASS | stable |
| invokeAction | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeLoader | 0.06ms | 10ms | PASS |
| invokeAction | 0.03ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| invokeLoader | 1058864 B | 0 B | 102400 B | PASS |
| invokeAction | 1344504 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### invokeLoader

# Perf Report — invokeLoader.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.05ms |
| total | 1.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.01ms | -0.00ms | -24.63% |
| p95 | 0.01ms | 0.02ms | -0.00ms | -12.60% |
| p99 | 0.03ms | 0.03ms | +0.00ms | +5.38% |
| mean | 0.01ms | 0.01ms | -0.00ms | -7.01% |
| min | 0.00ms | 0.00ms | +0.00ms | +1.26% |
| max | 0.05ms | 0.05ms | +0.00ms | +4.86% |
| total | 1.16ms | 1.25ms | -0.09ms | -7.01% |

### invokeAction

# Perf Report — invokeAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.02ms |
| min | 0.00ms |
| max | 0.23ms |
| total | 0.68ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -2.40% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +11.76% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +13.82% |
| mean | 0.00ms | 0.00ms | +0.00ms | +7.69% |
| min | 0.00ms | 0.00ms | +0.00ms | +2.80% |
| max | 0.23ms | 0.17ms | +0.07ms | +39.22% |
| total | 0.68ms | 0.63ms | +0.05ms | +7.69% |

