# Perf Suite — query

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| fetchQuery | 0.00042ms | 0.0021ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| mutate | 0.00071ms | 0.0012ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invalidateQuery | 0.00029ms | 0.00042ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| fetchQuery | 0.02ms | 10ms | PASS |
| mutate | 0.01ms | 10ms | PASS |
| invalidateQuery | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| fetchQuery | -16376 B | 0 B | 102400 B | yes | PASS |
| mutate | 7584 B | 0 B | 102400 B | yes | PASS |
| invalidateQuery | 688 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### fetchQuery

# Perf Report — fetchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00058ms |
| p95 | 0.0021ms |
| p99 | 0.0046ms |
| mean | 0.00086ms |
| stdev | 0.0012ms |
| min | 0.00042ms |
| max | 0.01ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00050ms | -0.000083ms | -16.60% |
| p50 | 0.00058ms | 0.00063ms | -0.000042ms | -6.72% |
| p95 | 0.0021ms | 0.0021ms | +0.000062ms | +3.02% |
| p99 | 0.0046ms | 0.0051ms | -0.00050ms | -9.78% |
| mean | 0.00086ms | 0.00086ms | +0.0000061ms | +0.72% |
| min | 0.00042ms | 0.00046ms | -0.000042ms | -9.17% |
| max | 0.01ms | 0.0097ms | +0.0048ms | +49.14% |
| total | 0.17ms | 0.17ms | +0.0012ms | +0.72% |

### mutate

# Perf Report — mutate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00071ms |
| p50 | 0.00075ms |
| p95 | 0.0012ms |
| p99 | 0.0090ms |
| mean | 0.00096ms |
| stdev | 0.0012ms |
| min | 0.00067ms |
| max | 0.01ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00071ms | 0.00075ms | -0.000042ms | -5.60% |
| p50 | 0.00075ms | 0.00079ms | -0.000042ms | -5.30% |
| p95 | 0.0012ms | 0.0013ms | -0.00013ms | -9.79% |
| p99 | 0.0090ms | 0.0092ms | -0.00016ms | -1.78% |
| mean | 0.00096ms | 0.0010ms | -0.000056ms | -5.48% |
| min | 0.00067ms | 0.00071ms | -0.000042ms | -5.93% |
| max | 0.01ms | 0.01ms | +0.00025ms | +2.39% |
| total | 0.19ms | 0.20ms | -0.01ms | -5.48% |

### invalidateQuery

# Perf Report — invalidateQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00042ms |
| p99 | 0.0020ms |
| mean | 0.00044ms |
| stdev | 0.0011ms |
| min | 0.00029ms |
| max | 0.02ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| p50 | 0.00033ms | 0.00033ms | -0.0000010ms | -0.30% |
| p95 | 0.00042ms | 0.00046ms | -0.000042ms | -9.15% |
| p99 | 0.0020ms | 0.0014ms | +0.00062ms | +44.59% |
| mean | 0.00044ms | 0.00045ms | -0.0000083ms | -1.86% |
| min | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.0028ms | +22.37% |
| total | 0.09ms | 0.09ms | -0.0017ms | -1.86% |

