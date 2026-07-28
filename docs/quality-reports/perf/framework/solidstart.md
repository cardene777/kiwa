# Perf Suite — solidstart

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeServerFunction | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +29734%) 以上の悪化が必要) |
| invokeApiRoute | 0.03ms | 5ms | PASS | stable (差 0.04ms が下限 0.5ms 未満で判定を保留) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeServerFunction | 0.01ms | 10ms | PASS |
| invokeApiRoute | 0.31ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeServerFunction | -4528 B | -31515 B | 102400 B | yes | PASS |
| invokeApiRoute | 57840 B | -990 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeServerFunction

# Perf Report — invokeServerFunction.serial

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
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -6.72% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -19.98% |
| p99 | 0.01ms | 0.04ms | -0.03ms | -74.55% |
| mean | 0.00ms | 0.00ms | -0.00ms | -58.37% |
| min | 0.00ms | 0.00ms | -0.00ms | -14.24% |
| max | 0.02ms | 0.15ms | -0.13ms | -88.82% |
| total | 0.17ms | 0.41ms | -0.24ms | -58.37% |

### invokeApiRoute

# Perf Report — invokeApiRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.06ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.10ms |
| total | 3.01ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -17.82% |
| p95 | 0.03ms | 0.07ms | -0.04ms | -60.89% |
| p99 | 0.06ms | 0.53ms | -0.47ms | -88.18% |
| mean | 0.02ms | 0.03ms | -0.02ms | -50.93% |
| min | 0.01ms | 0.01ms | +0.00ms | +5.55% |
| max | 0.10ms | 0.97ms | -0.86ms | -89.32% |
| total | 3.01ms | 6.14ms | -3.13ms | -50.93% |

