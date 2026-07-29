# Perf Suite — ruby

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dispatchRailsRequest | 0.00042ms | 0.0017ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| dispatchGenericRequest | 0.00038ms | 0.00076ms | 5ms | 0.00033ms | PASS | stable (p10 -10% (閾値未満)、 p95 +21% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| renderERB | 0.00038ms | 0.00068ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dispatchRailsRequest | 0.01ms | 10ms | PASS |
| dispatchGenericRequest | 0.01ms | 10ms | PASS |
| renderERB | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dispatchRailsRequest | -11384 B | 0 B | 102400 B | yes | PASS |
| dispatchGenericRequest | 440 B | 0 B | 102400 B | yes | PASS |
| renderERB | -2496 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dispatchRailsRequest

# Perf Report — dispatchRailsRequest.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.0017ms |
| p99 | 0.0039ms |
| mean | 0.00064ms |
| stdev | 0.00068ms |
| min | 0.00038ms |
| max | 0.0059ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00046ms | -0.000042ms | -9.17% |
| p50 | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| p95 | 0.0017ms | 0.0017ms | -0.0000041ms | -0.24% |
| p99 | 0.0039ms | 0.0045ms | -0.00062ms | -13.58% |
| mean | 0.00064ms | 0.00068ms | -0.000039ms | -5.77% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.0059ms | 0.0093ms | -0.0034ms | -36.77% |
| total | 0.13ms | 0.14ms | -0.0078ms | -5.77% |

### dispatchGenericRequest

# Perf Report — dispatchGenericRequest.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00076ms |
| p99 | 0.0034ms |
| mean | 0.00054ms |
| stdev | 0.00079ms |
| min | 0.00038ms |
| max | 0.0086ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00042ms | -0.000042ms | -10.07% |
| p50 | 0.00042ms | 0.00046ms | -0.000041ms | -8.95% |
| p95 | 0.00076ms | 0.00063ms | +0.00013ms | +21.34% |
| p99 | 0.0034ms | 0.0036ms | -0.00027ms | -7.47% |
| mean | 0.00054ms | 0.00056ms | -0.000012ms | -2.13% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.0086ms | 0.0059ms | +0.0028ms | +46.81% |
| total | 0.11ms | 0.11ms | -0.0024ms | -2.13% |

### renderERB

# Perf Report — renderERB.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00068ms |
| p99 | 0.0093ms |
| mean | 0.0010ms |
| stdev | 0.0065ms |
| min | 0.00038ms |
| max | 0.09ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p50 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p95 | 0.00068ms | 0.0010ms | -0.00032ms | -32.05% |
| p99 | 0.0093ms | 0.0091ms | +0.00021ms | +2.32% |
| mean | 0.0010ms | 0.00068ms | +0.00034ms | +50.54% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.09ms | 0.02ms | +0.07ms | +347.36% |
| total | 0.20ms | 0.14ms | +0.07ms | +50.54% |

