# Perf Suite — dogfood-trace-flame-graph

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| loadTrace | 0.00041ms | 0.0026ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| renderFlame | 0.00054ms | 0.0014ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| drillDown | 0.00054ms | 0.0061ms | 20ms | 0.00033ms | PASS | stable (p10 -0% (閾値未満)、 p95 +41% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| loadTrace | 0.01ms | 40ms | PASS |
| renderFlame | 0.01ms | 60ms | PASS |
| drillDown | 0.01ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| loadTrace | 26152 B | -36258 B | 102400 B | yes | PASS |
| renderFlame | 23616 B | 0 B | 102400 B | yes | PASS |
| drillDown | 53536 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### loadTrace

# Perf Report — loadTrace.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00041ms |
| p50 | 0.00042ms |
| p95 | 0.0026ms |
| p99 | 0.0037ms |
| mean | 0.00070ms |
| stdev | 0.00077ms |
| min | 0.00038ms |
| max | 0.0041ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00041ms | 0.00042ms | -0.0000041ms | -0.99% |
| p50 | 0.00042ms | 0.00046ms | -0.000042ms | -9.15% |
| p95 | 0.0026ms | 0.0027ms | -0.00015ms | -5.39% |
| p99 | 0.0037ms | 0.0036ms | +0.000072ms | +1.99% |
| mean | 0.00070ms | 0.00071ms | -0.000015ms | -2.05% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.0041ms | 0.0041ms | -0.000042ms | -1.02% |
| total | 0.03ms | 0.03ms | -0.00058ms | -2.05% |

### renderFlame

# Perf Report — renderFlame.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00054ms |
| p95 | 0.0014ms |
| p99 | 0.0049ms |
| mean | 0.00084ms |
| stdev | 0.00094ms |
| min | 0.00050ms |
| max | 0.0059ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00058ms | -0.000046ms | -7.91% |
| p50 | 0.00054ms | 0.00063ms | -0.000083ms | -13.28% |
| p95 | 0.0014ms | 0.0017ms | -0.00024ms | -14.33% |
| p99 | 0.0049ms | 0.0040ms | +0.00085ms | +20.99% |
| mean | 0.00084ms | 0.00086ms | -0.000026ms | -3.03% |
| min | 0.00050ms | 0.00058ms | -0.000083ms | -14.24% |
| max | 0.0059ms | 0.0045ms | +0.0014ms | +31.76% |
| total | 0.03ms | 0.03ms | -0.0010ms | -3.03% |

### drillDown

# Perf Report — drillDown.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00058ms |
| p95 | 0.0061ms |
| p99 | 0.01ms |
| mean | 0.0013ms |
| stdev | 0.0023ms |
| min | 0.00050ms |
| max | 0.01ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00054ms | -1.0e-7ms | -0.02% |
| p50 | 0.00058ms | 0.00058ms | 0.00ms | 0.00% |
| p95 | 0.0061ms | 0.0043ms | +0.0018ms | +41.49% |
| p99 | 0.01ms | 0.0060ms | +0.0045ms | +75.93% |
| mean | 0.0013ms | 0.0011ms | +0.00023ms | +21.30% |
| min | 0.00050ms | 0.00054ms | -0.000042ms | -7.75% |
| max | 0.01ms | 0.0063ms | +0.0068ms | +108.63% |
| total | 0.05ms | 0.04ms | +0.0094ms | +21.30% |

