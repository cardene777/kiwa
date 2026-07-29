# Perf Suite — query

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| fetchQuery | 0.00046ms | 0.0015ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| mutate | 0.00071ms | 0.0012ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invalidateQuery | 0.00029ms | 0.00038ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| fetchQuery | 0.02ms | 10ms | PASS |
| mutate | 0.02ms | 10ms | PASS |
| invalidateQuery | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| fetchQuery | -9968 B | 0 B | 102400 B | yes | PASS |
| mutate | -15192 B | 0 B | 102400 B | yes | PASS |
| invalidateQuery | 688 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### fetchQuery

# Perf Report — fetchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00058ms |
| p95 | 0.0015ms |
| p99 | 0.0045ms |
| mean | 0.00076ms |
| stdev | 0.00074ms |
| min | 0.00042ms |
| max | 0.0065ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| p50 | 0.00058ms | 0.00063ms | -0.000042ms | -6.72% |
| p95 | 0.0015ms | 0.0021ms | -0.00060ms | -28.91% |
| p99 | 0.0045ms | 0.0051ms | -0.00056ms | -10.92% |
| mean | 0.00076ms | 0.00086ms | -0.000098ms | -11.46% |
| min | 0.00042ms | 0.00046ms | -0.000041ms | -8.95% |
| max | 0.0065ms | 0.0097ms | -0.0033ms | -33.33% |
| total | 0.15ms | 0.17ms | -0.02ms | -11.46% |

### mutate

# Perf Report — mutate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00071ms |
| p50 | 0.00075ms |
| p95 | 0.0012ms |
| p99 | 0.0071ms |
| mean | 0.00094ms |
| stdev | 0.0010ms |
| min | 0.00067ms |
| max | 0.0096ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00071ms | 0.00075ms | -0.000042ms | -5.60% |
| p50 | 0.00075ms | 0.00079ms | -0.000042ms | -5.30% |
| p95 | 0.0012ms | 0.0013ms | -0.00012ms | -9.47% |
| p99 | 0.0071ms | 0.0092ms | -0.0021ms | -22.57% |
| mean | 0.00094ms | 0.0010ms | -0.000076ms | -7.42% |
| min | 0.00067ms | 0.00071ms | -0.000041ms | -5.79% |
| max | 0.0096ms | 0.01ms | -0.00079ms | -7.60% |
| total | 0.19ms | 0.20ms | -0.02ms | -7.42% |

### invalidateQuery

# Perf Report — invalidateQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00038ms |
| p99 | 0.0021ms |
| mean | 0.00043ms |
| stdev | 0.0011ms |
| min | 0.00029ms |
| max | 0.02ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| p50 | 0.00033ms | 0.00033ms | -0.0000010ms | -0.30% |
| p95 | 0.00038ms | 0.00046ms | -0.000084ms | -18.30% |
| p99 | 0.0021ms | 0.0014ms | +0.00066ms | +47.38% |
| mean | 0.00043ms | 0.00045ms | -0.000018ms | -4.10% |
| min | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.0027ms | +21.06% |
| total | 0.09ms | 0.09ms | -0.0037ms | -4.10% |

