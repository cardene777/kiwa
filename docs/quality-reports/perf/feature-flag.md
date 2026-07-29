# Perf Suite — feature-flag

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| evaluateFlag | 0.00042ms | 0.0020ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| evaluateAllFlags | 0.00083ms | 0.0011ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| registerRule | 0.00017ms | 0.00034ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +160%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluateFlag | 0.01ms | 10ms | PASS |
| evaluateAllFlags | 0.02ms | 10ms | PASS |
| registerRule | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluateFlag | 20280 B | 0 B | 102400 B | yes | PASS |
| evaluateAllFlags | 86440 B | 0 B | 102400 B | yes | PASS |
| registerRule | 19136 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluateFlag

# Perf Report — evaluateFlag.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00054ms |
| p95 | 0.0020ms |
| p99 | 0.0046ms |
| mean | 0.00081ms |
| stdev | 0.0011ms |
| min | 0.00038ms |
| max | 0.01ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p50 | 0.00054ms | 0.00056ms | -0.000021ms | -3.82% |
| p95 | 0.0020ms | 0.0021ms | -0.00017ms | -7.95% |
| p99 | 0.0046ms | 0.0066ms | -0.0020ms | -30.06% |
| mean | 0.00081ms | 0.00081ms | +0.0000052ms | +0.64% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00046ms | -4.01% |
| total | 0.16ms | 0.16ms | +0.0010ms | +0.64% |

### evaluateAllFlags

# Perf Report — evaluateAllFlags.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00083ms |
| p50 | 0.00088ms |
| p95 | 0.0011ms |
| p99 | 0.0032ms |
| mean | 0.00094ms |
| stdev | 0.00033ms |
| min | 0.00083ms |
| max | 0.0033ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00083ms | 0.00083ms | 0.00ms | 0.00% |
| p50 | 0.00088ms | 0.00092ms | -0.000042ms | -4.58% |
| p95 | 0.0011ms | 0.0012ms | -0.000081ms | -6.94% |
| p99 | 0.0032ms | 0.0020ms | +0.0012ms | +60.95% |
| mean | 0.00094ms | 0.00098ms | -0.000045ms | -4.57% |
| min | 0.00083ms | 0.00079ms | +0.000042ms | +5.31% |
| max | 0.0033ms | 0.0031ms | +0.00025ms | +8.11% |
| total | 0.19ms | 0.20ms | -0.0090ms | -4.57% |

### registerRule

# Perf Report — registerRule.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.00034ms |
| p99 | 0.0019ms |
| mean | 0.00032ms |
| stdev | 0.0010ms |
| min | 0.00017ms |
| max | 0.01ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00021ms | -0.000041ms | -19.71% |
| p50 | 0.00021ms | 0.00025ms | -0.000042ms | -16.60% |
| p95 | 0.00034ms | 0.00038ms | -0.000041ms | -10.87% |
| p99 | 0.0019ms | 0.0018ms | +0.000043ms | +2.33% |
| mean | 0.00032ms | 0.00031ms | +0.0000078ms | +2.55% |
| min | 0.00017ms | 0.00017ms | -0.0000010ms | -0.60% |
| max | 0.01ms | 0.0065ms | +0.0075ms | +116.14% |
| total | 0.06ms | 0.06ms | +0.0016ms | +2.55% |

