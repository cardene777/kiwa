# Perf Suite — solidstart

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeServerFunction | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +29734%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| invokeApiRoute | 0.03ms | 5ms | PASS | stable (差 0.04ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeServerFunction | 0.01ms | 10ms | PASS |
| invokeApiRoute | 0.14ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeServerFunction | -12888 B | 0 B | 102400 B | yes | PASS |
| invokeApiRoute | -125320 B | 2200 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeServerFunction

# Perf Report — invokeServerFunction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.02ms |
| mean | 0.03ms |
| stdev | 0.37ms |
| min | 0.00ms |
| max | 5.22ms |
| total | 5.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -13.36% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +68.85% |
| p99 | 0.02ms | 0.04ms | -0.02ms | -59.50% |
| mean | 0.03ms | 0.00ms | +0.03ms | +1209.42% |
| min | 0.00ms | 0.00ms | -0.00ms | -28.47% |
| max | 5.22ms | 0.15ms | +5.07ms | +3470.49% |
| total | 5.42ms | 0.41ms | +5.01ms | +1209.42% |

### invokeApiRoute

# Perf Report — invokeApiRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.09ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.13ms |
| total | 3.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -6.19% |
| p95 | 0.03ms | 0.07ms | -0.04ms | -53.54% |
| p99 | 0.09ms | 0.53ms | -0.44ms | -83.37% |
| mean | 0.02ms | 0.03ms | -0.01ms | -42.74% |
| min | 0.01ms | 0.01ms | +0.00ms | +1.28% |
| max | 0.13ms | 0.97ms | -0.83ms | -86.34% |
| total | 3.52ms | 6.14ms | -2.63ms | -42.74% |

