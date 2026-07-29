# Perf Suite — query

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| fetchQuery | 0.00042ms | 0.0021ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| mutate | 0.00067ms | 0.00096ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invalidateQuery | 0.00029ms | 0.00046ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| fetchQuery | 0.02ms | 10ms | PASS |
| mutate | 0.02ms | 10ms | PASS |
| invalidateQuery | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| fetchQuery | -12976 B | 0 B | 102400 B | yes | PASS |
| mutate | -15080 B | 0 B | 102400 B | yes | PASS |
| invalidateQuery | 592 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### fetchQuery

# Perf Report — fetchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00050ms |
| p95 | 0.0021ms |
| p99 | 0.0059ms |
| mean | 0.00084ms |
| stdev | 0.0010ms |
| min | 0.00042ms |
| max | 0.0083ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00050ms | -0.000083ms | -16.60% |
| p50 | 0.00050ms | 0.00063ms | -0.00013ms | -20.00% |
| p95 | 0.0021ms | 0.0021ms | +0.000021ms | +1.03% |
| p99 | 0.0059ms | 0.0051ms | +0.00082ms | +16.16% |
| mean | 0.00084ms | 0.00086ms | -0.000020ms | -2.38% |
| min | 0.00042ms | 0.00046ms | -0.000042ms | -9.17% |
| max | 0.0083ms | 0.0097ms | -0.0015ms | -15.38% |
| total | 0.17ms | 0.17ms | -0.0041ms | -2.38% |

### mutate

# Perf Report — mutate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00067ms |
| p50 | 0.00071ms |
| p95 | 0.00096ms |
| p99 | 0.0062ms |
| mean | 0.00088ms |
| stdev | 0.0010ms |
| min | 0.00063ms |
| max | 0.01ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00067ms | 0.00075ms | -0.000084ms | -11.20% |
| p50 | 0.00071ms | 0.00079ms | -0.000084ms | -10.61% |
| p95 | 0.00096ms | 0.0013ms | -0.00034ms | -26.21% |
| p99 | 0.0062ms | 0.0092ms | -0.0030ms | -32.56% |
| mean | 0.00088ms | 0.0010ms | -0.00014ms | -13.33% |
| min | 0.00063ms | 0.00071ms | -0.000083ms | -11.72% |
| max | 0.01ms | 0.01ms | -0.00025ms | -2.41% |
| total | 0.18ms | 0.20ms | -0.03ms | -13.33% |

### invalidateQuery

# Perf Report — invalidateQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00029ms |
| p95 | 0.00046ms |
| p99 | 0.0020ms |
| mean | 0.00040ms |
| stdev | 0.00061ms |
| min | 0.00029ms |
| max | 0.0067ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| p50 | 0.00029ms | 0.00033ms | -0.000042ms | -12.57% |
| p95 | 0.00046ms | 0.00046ms | -0.0000010ms | -0.22% |
| p99 | 0.0020ms | 0.0014ms | +0.00060ms | +43.29% |
| mean | 0.00040ms | 0.00045ms | -0.000047ms | -10.49% |
| min | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| max | 0.0067ms | 0.01ms | -0.0060ms | -47.36% |
| total | 0.08ms | 0.09ms | -0.0094ms | -10.49% |

