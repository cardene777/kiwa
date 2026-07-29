# Perf Suite — ruby

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dispatchRailsRequest | 0.00042ms | 0.0034ms | 5ms | 0.00033ms | PASS | stable (p10 -9% (閾値未満)、 p95 +101% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| dispatchGenericRequest | 0.00038ms | 0.00072ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| renderERB | 0.00038ms | 0.00055ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

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
| p95 | 0.0034ms |
| p99 | 0.0091ms |
| mean | 0.0013ms |
| stdev | 0.0050ms |
| min | 0.00042ms |
| max | 0.05ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00046ms | -0.000041ms | -8.95% |
| p50 | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| p95 | 0.0034ms | 0.0017ms | +0.0017ms | +100.73% |
| p99 | 0.0091ms | 0.0045ms | +0.0045ms | +99.12% |
| mean | 0.0013ms | 0.00068ms | +0.00060ms | +88.07% |
| min | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| max | 0.05ms | 0.0093ms | +0.04ms | +452.06% |
| total | 0.25ms | 0.14ms | +0.12ms | +88.07% |

### dispatchGenericRequest

# Perf Report — dispatchGenericRequest.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00072ms |
| p99 | 0.0039ms |
| mean | 0.00053ms |
| stdev | 0.00067ms |
| min | 0.00038ms |
| max | 0.0070ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00042ms | -0.000042ms | -10.07% |
| p50 | 0.00042ms | 0.00046ms | -0.000041ms | -8.95% |
| p95 | 0.00072ms | 0.00063ms | +0.000092ms | +14.77% |
| p99 | 0.0039ms | 0.0036ms | +0.00021ms | +5.90% |
| mean | 0.00053ms | 0.00056ms | -0.000023ms | -4.23% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.0070ms | 0.0059ms | +0.0011ms | +18.43% |
| total | 0.11ms | 0.11ms | -0.0047ms | -4.23% |

### renderERB

# Perf Report — renderERB.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00055ms |
| p99 | 0.0040ms |
| mean | 0.00054ms |
| stdev | 0.00087ms |
| min | 0.00038ms |
| max | 0.0097ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p50 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p95 | 0.00055ms | 0.0010ms | -0.00045ms | -44.97% |
| p99 | 0.0040ms | 0.0091ms | -0.0051ms | -55.65% |
| mean | 0.00054ms | 0.00068ms | -0.00014ms | -20.01% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.0097ms | 0.02ms | -0.01ms | -52.65% |
| total | 0.11ms | 0.14ms | -0.03ms | -20.01% |

