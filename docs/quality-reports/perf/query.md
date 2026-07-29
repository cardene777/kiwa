# Perf Suite — query

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00042ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00083ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| fetchQuery | 0.00054ms | 0.0017ms | 5ms | 0.00083ms | PASS | stable (検知には +0.00083ms (baseline 比 +167%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| mutate | 0.00071ms | 0.0012ms | 5ms | 0.00083ms | PASS | stable (検知には +0.00083ms (baseline 比 +111%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| invalidateQuery | 0.00029ms | 0.00068ms | 5ms | 0.00083ms | PASS | stable (検知には +0.00083ms (baseline 比 +250%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| fetchQuery | 0.02ms | 10ms | PASS |
| mutate | 0.02ms | 10ms | PASS |
| invalidateQuery | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| fetchQuery | -17816 B | 0 B | 102400 B | yes | PASS |
| mutate | -6112 B | 0 B | 102400 B | yes | PASS |
| invalidateQuery | 2632 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### fetchQuery

# Perf Report — fetchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00058ms |
| p95 | 0.0017ms |
| p99 | 0.0049ms |
| mean | 0.00079ms |
| stdev | 0.00097ms |
| min | 0.00054ms |
| max | 0.01ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00050ms | +0.000042ms | +8.40% |
| p50 | 0.00058ms | 0.00063ms | -0.000042ms | -6.72% |
| p95 | 0.0017ms | 0.0021ms | -0.00039ms | -18.89% |
| p99 | 0.0049ms | 0.0051ms | -0.00022ms | -4.41% |
| mean | 0.00079ms | 0.00086ms | -0.000071ms | -8.24% |
| min | 0.00054ms | 0.00046ms | +0.000083ms | +18.12% |
| max | 0.01ms | 0.0097ms | +0.0019ms | +19.66% |
| total | 0.16ms | 0.17ms | -0.01ms | -8.24% |

### mutate

# Perf Report — mutate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00071ms |
| p50 | 0.00075ms |
| p95 | 0.0012ms |
| p99 | 0.0072ms |
| mean | 0.00094ms |
| stdev | 0.0011ms |
| min | 0.00071ms |
| max | 0.01ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00071ms | 0.00075ms | -0.000042ms | -5.60% |
| p50 | 0.00075ms | 0.00079ms | -0.000042ms | -5.30% |
| p95 | 0.0012ms | 0.0013ms | -0.00012ms | -9.54% |
| p99 | 0.0072ms | 0.0092ms | -0.0020ms | -22.02% |
| mean | 0.00094ms | 0.0010ms | -0.000079ms | -7.73% |
| min | 0.00071ms | 0.00071ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.000083ms | +0.80% |
| total | 0.19ms | 0.20ms | -0.02ms | -7.73% |

### invalidateQuery

# Perf Report — invalidateQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00068ms |
| p99 | 0.02ms |
| mean | 0.00081ms |
| stdev | 0.0033ms |
| min | 0.00029ms |
| max | 0.03ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| p50 | 0.00033ms | 0.00033ms | -0.0000010ms | -0.30% |
| p95 | 0.00068ms | 0.00046ms | +0.00022ms | +48.94% |
| p99 | 0.02ms | 0.0014ms | +0.02ms | +1244.25% |
| mean | 0.00081ms | 0.00045ms | +0.00036ms | +80.98% |
| min | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| max | 0.03ms | 0.01ms | +0.02ms | +156.59% |
| total | 0.16ms | 0.09ms | +0.07ms | +80.98% |

