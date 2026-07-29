# Perf Suite — ruby

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dispatchRailsRequest | 0.00042ms | 0.0016ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| dispatchGenericRequest | 0.00038ms | 0.0012ms | 5ms | 0.00033ms | PASS | stable (p10 -10% (閾値未満)、 p95 +88% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| renderERB | 0.00038ms | 0.00060ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dispatchRailsRequest | 0.01ms | 10ms | PASS |
| dispatchGenericRequest | 0.02ms | 10ms | PASS |
| renderERB | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dispatchRailsRequest | -13416 B | 0 B | 102400 B | yes | PASS |
| dispatchGenericRequest | -360 B | 0 B | 102400 B | yes | PASS |
| renderERB | -3520 B | 0 B | 102400 B | yes | PASS |

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
| p99 | 0.0042ms |
| mean | 0.00063ms |
| stdev | 0.00066ms |
| min | 0.00038ms |
| max | 0.0058ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00046ms | -0.000041ms | -8.95% |
| p50 | 0.00046ms | 0.00050ms | -0.000041ms | -8.20% |
| p95 | 0.0016ms | 0.0017ms | -0.000083ms | -4.85% |
| p99 | 0.0042ms | 0.0045ms | -0.00038ms | -8.32% |
| mean | 0.00063ms | 0.00068ms | -0.000042ms | -6.23% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.0058ms | 0.0093ms | -0.0035ms | -37.66% |
| total | 0.13ms | 0.14ms | -0.0084ms | -6.23% |

### dispatchGenericRequest

# Perf Report — dispatchGenericRequest.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.0012ms |
| p99 | 0.0068ms |
| mean | 0.00061ms |
| stdev | 0.0011ms |
| min | 0.00038ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00042ms | -0.000042ms | -10.07% |
| p50 | 0.00042ms | 0.00046ms | -0.000041ms | -8.95% |
| p95 | 0.0012ms | 0.00063ms | +0.00055ms | +87.72% |
| p99 | 0.0068ms | 0.0036ms | +0.0032ms | +86.84% |
| mean | 0.00061ms | 0.00056ms | +0.000055ms | +9.90% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.01ms | 0.0059ms | +0.0054ms | +91.49% |
| total | 0.12ms | 0.11ms | +0.01ms | +9.90% |

### renderERB

# Perf Report — renderERB.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00060ms |
| p99 | 0.0050ms |
| mean | 0.00058ms |
| stdev | 0.0012ms |
| min | 0.00033ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p50 | 0.00042ms | 0.00042ms | -0.0000010ms | -0.24% |
| p95 | 0.00060ms | 0.0010ms | -0.00040ms | -39.83% |
| p99 | 0.0050ms | 0.0091ms | -0.0041ms | -45.28% |
| mean | 0.00058ms | 0.00068ms | -0.00010ms | -14.93% |
| min | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| max | 0.01ms | 0.02ms | -0.0074ms | -36.12% |
| total | 0.12ms | 0.14ms | -0.02ms | -14.93% |

