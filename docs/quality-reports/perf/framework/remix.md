# Perf Suite — remix

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeLoader | 0.02ms | 5ms | PASS | stable (差 0.02ms が下限 0.5ms 未満で判定を保留) |
| invokeAction | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +12078%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeLoader | 0.07ms | 10ms | PASS |
| invokeAction | 0.04ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeLoader | -37344 B | 0 B | 102400 B | yes | PASS |
| invokeAction | -19336 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeLoader

# Perf Report — invokeLoader.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.06ms |
| total | 1.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -6.56% |
| p95 | 0.02ms | 0.04ms | -0.02ms | -54.28% |
| p99 | 0.03ms | 0.07ms | -0.03ms | -49.52% |
| mean | 0.01ms | 0.01ms | -0.00ms | -45.60% |
| min | 0.00ms | 0.00ms | -0.00ms | -19.35% |
| max | 0.06ms | 0.14ms | -0.08ms | -59.07% |
| total | 1.14ms | 2.09ms | -0.95ms | -45.60% |

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
| max | 0.02ms |
| total | 0.69ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +11.62% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +12.23% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +36.51% |
| mean | 0.00ms | 0.00ms | +0.00ms | +10.83% |
| min | 0.00ms | 0.00ms | +0.00ms | +12.30% |
| max | 0.02ms | 0.01ms | +0.00ms | +7.25% |
| total | 0.69ms | 0.63ms | +0.07ms | +10.83% |

