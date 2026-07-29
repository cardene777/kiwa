# Perf Suite — ruby

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dispatchRailsRequest | 0.00050ms | 0.0018ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| dispatchGenericRequest | 0.00042ms | 0.0012ms | 5ms | 0.00033ms | PASS | stable (p10 -0% (閾値未満)、 p95 +94% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| renderERB | 0.00042ms | 0.00085ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dispatchRailsRequest | 0.01ms | 10ms | PASS |
| dispatchGenericRequest | 0.03ms | 10ms | PASS |
| renderERB | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dispatchRailsRequest | -8520 B | -48014 B | 102400 B | yes | PASS |
| dispatchGenericRequest | 616 B | 0 B | 102400 B | yes | PASS |
| renderERB | -17848 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dispatchRailsRequest

# Perf Report — dispatchRailsRequest.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00050ms |
| p95 | 0.0018ms |
| p99 | 0.0041ms |
| mean | 0.00080ms |
| stdev | 0.00081ms |
| min | 0.00046ms |
| max | 0.0063ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00046ms | +0.000038ms | +8.28% |
| p50 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p95 | 0.0018ms | 0.0017ms | +0.00013ms | +7.30% |
| p99 | 0.0041ms | 0.0045ms | -0.00045ms | -9.79% |
| mean | 0.00080ms | 0.00068ms | +0.00013ms | +18.61% |
| min | 0.00046ms | 0.00042ms | +0.000042ms | +10.10% |
| max | 0.0063ms | 0.0093ms | -0.0030ms | -32.73% |
| total | 0.16ms | 0.14ms | +0.03ms | +18.61% |

### dispatchGenericRequest

# Perf Report — dispatchGenericRequest.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.0012ms |
| p99 | 0.0079ms |
| mean | 0.00067ms |
| stdev | 0.0013ms |
| min | 0.00038ms |
| max | 0.01ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | -0.0000010ms | -0.24% |
| p50 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p95 | 0.0012ms | 0.00063ms | +0.00059ms | +93.95% |
| p99 | 0.0079ms | 0.0036ms | +0.0043ms | +116.89% |
| mean | 0.00067ms | 0.00056ms | +0.00012ms | +20.90% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.01ms | 0.0059ms | +0.0057ms | +96.44% |
| total | 0.13ms | 0.11ms | +0.02ms | +20.90% |

### renderERB

# Perf Report — renderERB.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.00085ms |
| p99 | 0.0049ms |
| mean | 0.00066ms |
| stdev | 0.0014ms |
| min | 0.00042ms |
| max | 0.02ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00038ms | +0.000042ms | +11.20% |
| p50 | 0.00046ms | 0.00042ms | +0.000041ms | +9.83% |
| p95 | 0.00085ms | 0.0010ms | -0.00015ms | -15.45% |
| p99 | 0.0049ms | 0.0091ms | -0.0042ms | -45.73% |
| mean | 0.00066ms | 0.00068ms | -0.000020ms | -2.90% |
| min | 0.00042ms | 0.00038ms | +0.000041ms | +10.93% |
| max | 0.02ms | 0.02ms | -0.0032ms | -15.91% |
| total | 0.13ms | 0.14ms | -0.0039ms | -2.90% |

