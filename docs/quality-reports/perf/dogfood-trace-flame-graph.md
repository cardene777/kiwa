# Perf Suite — dogfood-trace-flame-graph

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| loadTrace | 0.00038ms | 0.0028ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| renderFlame | 0.00050ms | 0.0017ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| drillDown | 0.00050ms | 0.0051ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| loadTrace | 0.01ms | 40ms | PASS |
| renderFlame | 0.01ms | 60ms | PASS |
| drillDown | 0.01ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| loadTrace | 9928 B | -36273 B | 102400 B | yes | PASS |
| renderFlame | 18440 B | 0 B | 102400 B | yes | PASS |
| drillDown | 38352 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### loadTrace

# Perf Report — loadTrace.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.0028ms |
| p99 | 0.0034ms |
| mean | 0.00067ms |
| stdev | 0.00073ms |
| min | 0.00038ms |
| max | 0.0035ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| p50 | 0.00042ms | 0.00046ms | -0.000043ms | -9.37% |
| p95 | 0.0028ms | 0.0027ms | +0.000059ms | +2.16% |
| p99 | 0.0034ms | 0.0036ms | -0.00023ms | -6.52% |
| mean | 0.00067ms | 0.00071ms | -0.000042ms | -5.88% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.0035ms | 0.0041ms | -0.00063ms | -15.15% |
| total | 0.03ms | 0.03ms | -0.0017ms | -5.88% |

### renderFlame

# Perf Report — renderFlame.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.0017ms |
| p99 | 0.0038ms |
| mean | 0.00079ms |
| stdev | 0.00071ms |
| min | 0.00050ms |
| max | 0.0043ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00058ms | -0.000083ms | -14.24% |
| p50 | 0.00054ms | 0.00063ms | -0.000083ms | -13.28% |
| p95 | 0.0017ms | 0.0017ms | +0.000021ms | +1.26% |
| p99 | 0.0038ms | 0.0040ms | -0.00027ms | -6.78% |
| mean | 0.00079ms | 0.00086ms | -0.000074ms | -8.57% |
| min | 0.00050ms | 0.00058ms | -0.000083ms | -14.24% |
| max | 0.0043ms | 0.0045ms | -0.00021ms | -4.69% |
| total | 0.03ms | 0.03ms | -0.0030ms | -8.57% |

### drillDown

# Perf Report — drillDown.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.0051ms |
| p99 | 0.0059ms |
| mean | 0.0011ms |
| stdev | 0.0015ms |
| min | 0.00046ms |
| max | 0.0060ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00054ms | -0.000042ms | -7.75% |
| p50 | 0.00054ms | 0.00058ms | -0.000041ms | -7.03% |
| p95 | 0.0051ms | 0.0043ms | +0.00076ms | +17.74% |
| p99 | 0.0059ms | 0.0060ms | -0.000054ms | -0.91% |
| mean | 0.0011ms | 0.0011ms | -0.000012ms | -1.05% |
| min | 0.00046ms | 0.00054ms | -0.000084ms | -15.50% |
| max | 0.0060ms | 0.0063ms | -0.00025ms | -3.96% |
| total | 0.04ms | 0.04ms | -0.00046ms | -1.05% |

