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
| invokeLoader | 0.05ms | 10ms | PASS |
| invokeAction | 0.04ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeLoader | -39208 B | 0 B | 102400 B | yes | PASS |
| invokeAction | -19040 B | 0 B | 102400 B | yes | PASS |

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
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.04ms |
| total | 1.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +7.59% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +12.48% |
| p99 | 0.03ms | 0.03ms | -0.00ms | -7.86% |
| mean | 0.01ms | 0.01ms | +0.00ms | +8.68% |
| min | 0.00ms | 0.00ms | +0.00ms | +10.77% |
| max | 0.04ms | 0.04ms | -0.00ms | -0.97% |
| total | 1.13ms | 1.04ms | +0.09ms | +8.68% |

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
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.69ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +13.04% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -5.40% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -62.56% |
| mean | 0.00ms | 0.00ms | +0.00ms | +0.84% |
| min | 0.00ms | 0.00ms | +0.00ms | +13.85% |
| max | 0.01ms | 0.05ms | -0.04ms | -78.96% |
| total | 0.69ms | 0.68ms | +0.01ms | +0.84% |

