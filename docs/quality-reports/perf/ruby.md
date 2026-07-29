# Perf Suite — ruby

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dispatchRailsRequest | 0.00046ms | 0.0015ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| dispatchGenericRequest | 0.00038ms | 0.00092ms | 5ms | 0.00033ms | PASS | stable (p10 -10% (閾値未満)、 p95 +47% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| renderERB | 0.00041ms | 0.00060ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dispatchRailsRequest | 0.01ms | 10ms | PASS |
| dispatchGenericRequest | 0.01ms | 10ms | PASS |
| renderERB | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dispatchRailsRequest | -13160 B | 0 B | 102400 B | yes | PASS |
| dispatchGenericRequest | 440 B | 0 B | 102400 B | yes | PASS |
| renderERB | -3520 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dispatchRailsRequest

# Perf Report — dispatchRailsRequest.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.0015ms |
| p99 | 0.0039ms |
| mean | 0.00064ms |
| stdev | 0.00067ms |
| min | 0.00042ms |
| max | 0.0064ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p50 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p95 | 0.0015ms | 0.0017ms | -0.00024ms | -14.24% |
| p99 | 0.0039ms | 0.0045ms | -0.00067ms | -14.73% |
| mean | 0.00064ms | 0.00068ms | -0.000037ms | -5.48% |
| min | 0.00042ms | 0.00042ms | +0.0000010ms | +0.24% |
| max | 0.0064ms | 0.0093ms | -0.0029ms | -30.93% |
| total | 0.13ms | 0.14ms | -0.0074ms | -5.48% |

### dispatchGenericRequest

# Perf Report — dispatchGenericRequest.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00092ms |
| p99 | 0.0041ms |
| mean | 0.00055ms |
| stdev | 0.00069ms |
| min | 0.00033ms |
| max | 0.0066ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00042ms | -0.000042ms | -10.07% |
| p50 | 0.00042ms | 0.00046ms | -0.000041ms | -8.95% |
| p95 | 0.00092ms | 0.00063ms | +0.00029ms | +46.57% |
| p99 | 0.0041ms | 0.0036ms | +0.00043ms | +11.81% |
| mean | 0.00055ms | 0.00056ms | -0.0000069ms | -1.24% |
| min | 0.00033ms | 0.00042ms | -0.000083ms | -19.95% |
| max | 0.0066ms | 0.0059ms | +0.00075ms | +12.77% |
| total | 0.11ms | 0.11ms | -0.0014ms | -1.24% |

### renderERB

# Perf Report — renderERB.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00041ms |
| p50 | 0.00042ms |
| p95 | 0.00060ms |
| p99 | 0.0047ms |
| mean | 0.00056ms |
| stdev | 0.00093ms |
| min | 0.00038ms |
| max | 0.0091ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00041ms | 0.00038ms | +0.000037ms | +9.84% |
| p50 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p95 | 0.00060ms | 0.0010ms | -0.00040ms | -40.24% |
| p99 | 0.0047ms | 0.0091ms | -0.0043ms | -47.77% |
| mean | 0.00056ms | 0.00068ms | -0.00012ms | -17.10% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.0091ms | 0.02ms | -0.01ms | -55.51% |
| total | 0.11ms | 0.14ms | -0.02ms | -17.10% |

