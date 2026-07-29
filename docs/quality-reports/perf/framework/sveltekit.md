# Perf Suite — sveltekit

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeLoad | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +19438%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| invokeAction | 0.07ms | 5ms | PASS | stable (差 0.04ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeLoad | 0.02ms | 10ms | PASS |
| invokeAction | 0.14ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeLoad | -1664 B | -32621 B | 102400 B | yes | PASS |
| invokeAction | 29304 B | -41344 B | 102400 B | yes | PASS |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +10.62% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -36.34% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +3.51% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.59% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.02ms | -0.00ms | -2.54% |
| total | 0.24ms | 0.23ms | +0.00ms | +1.59% |

### invokeAction

# Perf Report — invokeAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.02ms |
| p95 | 0.07ms |
| p99 | 0.17ms |
| mean | 0.04ms |
| stdev | 0.19ms |
| min | 0.01ms |
| max | 2.64ms |
| total | 7.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.01ms | +0.01ms | +41.18% |
| p95 | 0.07ms | 0.03ms | +0.04ms | +132.88% |
| p99 | 0.17ms | 0.07ms | +0.09ms | +124.44% |
| mean | 0.04ms | 0.02ms | +0.02ms | +132.17% |
| min | 0.01ms | 0.01ms | +0.00ms | +2.30% |
| max | 2.64ms | 0.12ms | +2.53ms | +2193.96% |
| total | 7.47ms | 3.22ms | +4.25ms | +132.17% |

