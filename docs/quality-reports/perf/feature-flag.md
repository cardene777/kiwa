# Perf Suite — feature-flag

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00042ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00083ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| evaluateFlag | 0.00054ms | 0.0020ms | 5ms | 0.00083ms | PASS | stable (差 0.00013ms が下限 0.00083ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| evaluateAllFlags | 0.00096ms | 0.0015ms | 5ms | 0.00083ms | PASS | stable (検知には +0.00083ms (baseline 比 +100%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| registerRule | 0.00021ms | 0.00034ms | 5ms | 0.00083ms | PASS | stable (検知には +0.00083ms (baseline 比 +401%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluateFlag | 0.01ms | 10ms | PASS |
| evaluateAllFlags | 0.02ms | 10ms | PASS |
| registerRule | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluateFlag | 23912 B | 0 B | 102400 B | yes | PASS |
| evaluateAllFlags | 87112 B | 0 B | 102400 B | yes | PASS |
| registerRule | 18960 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluateFlag

# Perf Report — evaluateFlag.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00058ms |
| p95 | 0.0020ms |
| p99 | 0.01ms |
| mean | 0.00088ms |
| stdev | 0.0014ms |
| min | 0.00054ms |
| max | 0.01ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00042ms | +0.00013ms | +30.29% |
| p50 | 0.00058ms | 0.00056ms | +0.000022ms | +3.82% |
| p95 | 0.0020ms | 0.0021ms | -0.000082ms | -3.85% |
| p99 | 0.01ms | 0.0066ms | +0.0034ms | +52.44% |
| mean | 0.00088ms | 0.00081ms | +0.000079ms | +9.83% |
| min | 0.00054ms | 0.00038ms | +0.00017ms | +44.27% |
| max | 0.01ms | 0.01ms | +0.0025ms | +22.28% |
| total | 0.18ms | 0.16ms | +0.02ms | +9.83% |

### evaluateAllFlags

# Perf Report — evaluateAllFlags.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00096ms |
| p50 | 0.0010ms |
| p95 | 0.0015ms |
| p99 | 0.0041ms |
| mean | 0.0012ms |
| stdev | 0.00060ms |
| min | 0.00096ms |
| max | 0.0071ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00096ms | 0.00083ms | +0.00013ms | +15.13% |
| p50 | 0.0010ms | 0.00092ms | +0.00013ms | +13.63% |
| p95 | 0.0015ms | 0.0012ms | +0.00038ms | +32.87% |
| p99 | 0.0041ms | 0.0020ms | +0.0022ms | +109.75% |
| mean | 0.0012ms | 0.00098ms | +0.00018ms | +18.04% |
| min | 0.00096ms | 0.00079ms | +0.00017ms | +21.11% |
| max | 0.0071ms | 0.0031ms | +0.0040ms | +129.74% |
| total | 0.23ms | 0.20ms | +0.04ms | +18.04% |

### registerRule

# Perf Report — registerRule.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00021ms |
| p95 | 0.00034ms |
| p99 | 0.0017ms |
| mean | 0.00028ms |
| stdev | 0.00049ms |
| min | 0.00017ms |
| max | 0.0065ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p50 | 0.00021ms | 0.00025ms | -0.000042ms | -16.80% |
| p95 | 0.00034ms | 0.00038ms | -0.000041ms | -10.87% |
| p99 | 0.0017ms | 0.0018ms | -0.00016ms | -8.95% |
| mean | 0.00028ms | 0.00031ms | -0.000032ms | -10.36% |
| min | 0.00017ms | 0.00017ms | -0.0000010ms | -0.60% |
| max | 0.0065ms | 0.0065ms | +0.0000010ms | +0.02% |
| total | 0.06ms | 0.06ms | -0.0064ms | -10.36% |

