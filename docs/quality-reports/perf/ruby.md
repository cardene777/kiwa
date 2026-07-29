# Perf Suite — ruby

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dispatchRailsRequest | 0.00042ms | 0.0016ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| dispatchGenericRequest | 0.00038ms | 0.00073ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| renderERB | 0.00038ms | 0.00092ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dispatchRailsRequest | 0.01ms | 10ms | PASS |
| dispatchGenericRequest | 0.01ms | 10ms | PASS |
| renderERB | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dispatchRailsRequest | -8936 B | 0 B | 102400 B | yes | PASS |
| dispatchGenericRequest | 40 B | 0 B | 102400 B | yes | PASS |
| renderERB | -2400 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dispatchRailsRequest

# Perf Report — dispatchRailsRequest.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.0016ms |
| p99 | 0.0040ms |
| mean | 0.00066ms |
| stdev | 0.00083ms |
| min | 0.00038ms |
| max | 0.0083ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00046ms | -0.000041ms | -8.95% |
| p50 | 0.00046ms | 0.00050ms | -0.000041ms | -8.20% |
| p95 | 0.0016ms | 0.0017ms | -0.000085ms | -4.97% |
| p99 | 0.0040ms | 0.0045ms | -0.00052ms | -11.54% |
| mean | 0.00066ms | 0.00068ms | -0.000015ms | -2.18% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.0083ms | 0.0093ms | -0.0010ms | -11.20% |
| total | 0.13ms | 0.14ms | -0.0029ms | -2.18% |

### dispatchGenericRequest

# Perf Report — dispatchGenericRequest.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00073ms |
| p99 | 0.0038ms |
| mean | 0.00053ms |
| stdev | 0.00063ms |
| min | 0.00038ms |
| max | 0.0063ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00042ms | -0.000042ms | -10.07% |
| p50 | 0.00042ms | 0.00046ms | -0.000041ms | -8.95% |
| p95 | 0.00073ms | 0.00063ms | +0.00010ms | +16.44% |
| p99 | 0.0038ms | 0.0036ms | +0.00013ms | +3.55% |
| mean | 0.00053ms | 0.00056ms | -0.000023ms | -4.11% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.0063ms | 0.0059ms | +0.00038ms | +6.38% |
| total | 0.11ms | 0.11ms | -0.0046ms | -4.11% |

### renderERB

# Perf Report — renderERB.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00092ms |
| p99 | 0.0045ms |
| mean | 0.00063ms |
| stdev | 0.0016ms |
| min | 0.00038ms |
| max | 0.02ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p50 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p95 | 0.00092ms | 0.0010ms | -0.000077ms | -7.68% |
| p99 | 0.0045ms | 0.0091ms | -0.0046ms | -50.32% |
| mean | 0.00063ms | 0.00068ms | -0.000049ms | -7.14% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.02ms | +0.00046ms | +2.25% |
| total | 0.13ms | 0.14ms | -0.0097ms | -7.14% |

