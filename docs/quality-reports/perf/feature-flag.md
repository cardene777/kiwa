# Perf Suite — feature-flag

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| evaluateFlag | 0.00042ms | 0.0020ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| evaluateAllFlags | 0.00088ms | 0.0011ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| registerRule | 0.00021ms | 0.00042ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +160%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluateFlag | 0.01ms | 10ms | PASS |
| evaluateAllFlags | 0.02ms | 10ms | PASS |
| registerRule | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluateFlag | 14624 B | 0 B | 102400 B | yes | PASS |
| evaluateAllFlags | 70584 B | 0 B | 102400 B | yes | PASS |
| registerRule | 20144 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluateFlag

# Perf Report — evaluateFlag.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00058ms |
| p95 | 0.0020ms |
| p99 | 0.01ms |
| mean | 0.00094ms |
| stdev | 0.0019ms |
| min | 0.00038ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | +0.0000010ms | +0.24% |
| p50 | 0.00058ms | 0.00056ms | +0.000021ms | +3.64% |
| p95 | 0.0020ms | 0.0021ms | -0.00013ms | -5.98% |
| p99 | 0.01ms | 0.0066ms | +0.0036ms | +55.14% |
| mean | 0.00094ms | 0.00081ms | +0.00013ms | +16.21% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.0086ms | +75.56% |
| total | 0.19ms | 0.16ms | +0.03ms | +16.21% |

### evaluateAllFlags

# Perf Report — evaluateAllFlags.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00088ms |
| p50 | 0.00088ms |
| p95 | 0.0011ms |
| p99 | 0.0021ms |
| mean | 0.00095ms |
| stdev | 0.00027ms |
| min | 0.00083ms |
| max | 0.0035ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00088ms | 0.00083ms | +0.000042ms | +5.04% |
| p50 | 0.00088ms | 0.00092ms | -0.000042ms | -4.58% |
| p95 | 0.0011ms | 0.0012ms | -0.000039ms | -3.34% |
| p99 | 0.0021ms | 0.0020ms | +0.000082ms | +4.16% |
| mean | 0.00095ms | 0.00098ms | -0.000036ms | -3.66% |
| min | 0.00083ms | 0.00079ms | +0.000042ms | +5.31% |
| max | 0.0035ms | 0.0031ms | +0.00042ms | +13.53% |
| total | 0.19ms | 0.20ms | -0.0072ms | -3.66% |

### registerRule

# Perf Report — registerRule.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00021ms |
| p95 | 0.00042ms |
| p99 | 0.0023ms |
| mean | 0.00036ms |
| stdev | 0.0012ms |
| min | 0.00017ms |
| max | 0.02ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p50 | 0.00021ms | 0.00025ms | -0.000041ms | -16.40% |
| p95 | 0.00042ms | 0.00038ms | +0.000042ms | +11.15% |
| p99 | 0.0023ms | 0.0018ms | +0.00050ms | +27.10% |
| mean | 0.00036ms | 0.00031ms | +0.000055ms | +17.76% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.0065ms | +0.01ms | +156.15% |
| total | 0.07ms | 0.06ms | +0.01ms | +17.76% |

