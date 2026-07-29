# Perf Suite — ruby

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dispatchRailsRequest | 0.00042ms | 0.0021ms | 5ms | 0.00033ms | PASS | stable (p10 -9% (閾値未満)、 p95 +24% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| dispatchGenericRequest | 0.00038ms | 0.00081ms | 5ms | 0.00033ms | PASS | stable (p10 -10% (閾値未満)、 p95 +30% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| renderERB | 0.00038ms | 0.00080ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dispatchRailsRequest | 0.01ms | 10ms | PASS |
| dispatchGenericRequest | 0.02ms | 10ms | PASS |
| renderERB | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dispatchRailsRequest | -13168 B | 0 B | 102400 B | yes | PASS |
| dispatchGenericRequest | 440 B | 0 B | 102400 B | yes | PASS |
| renderERB | -2400 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dispatchRailsRequest

# Perf Report — dispatchRailsRequest.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00050ms |
| p95 | 0.0021ms |
| p99 | 0.0041ms |
| mean | 0.00080ms |
| stdev | 0.00082ms |
| min | 0.00042ms |
| max | 0.0072ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00046ms | -0.000041ms | -8.95% |
| p50 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p95 | 0.0021ms | 0.0017ms | +0.00041ms | +24.11% |
| p99 | 0.0041ms | 0.0045ms | -0.00046ms | -10.03% |
| mean | 0.00080ms | 0.00068ms | +0.00012ms | +18.21% |
| min | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| max | 0.0072ms | 0.0093ms | -0.0021ms | -22.41% |
| total | 0.16ms | 0.14ms | +0.02ms | +18.21% |

### dispatchGenericRequest

# Perf Report — dispatchGenericRequest.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00081ms |
| p99 | 0.0037ms |
| mean | 0.00055ms |
| stdev | 0.00074ms |
| min | 0.00038ms |
| max | 0.0075ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00042ms | -0.000042ms | -10.07% |
| p50 | 0.00042ms | 0.00046ms | -0.000041ms | -8.95% |
| p95 | 0.00081ms | 0.00063ms | +0.00018ms | +29.56% |
| p99 | 0.0037ms | 0.0036ms | +0.00010ms | +2.86% |
| mean | 0.00055ms | 0.00056ms | -0.0000068ms | -1.23% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.0075ms | 0.0059ms | +0.0017ms | +28.37% |
| total | 0.11ms | 0.11ms | -0.0014ms | -1.23% |

### renderERB

# Perf Report — renderERB.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00080ms |
| p99 | 0.0042ms |
| mean | 0.00056ms |
| stdev | 0.00096ms |
| min | 0.00038ms |
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p50 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p95 | 0.00080ms | 0.0010ms | -0.00020ms | -19.65% |
| p99 | 0.0042ms | 0.0091ms | -0.0049ms | -53.79% |
| mean | 0.00056ms | 0.00068ms | -0.00012ms | -17.71% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.02ms | -0.0092ms | -44.90% |
| total | 0.11ms | 0.14ms | -0.02ms | -17.71% |

