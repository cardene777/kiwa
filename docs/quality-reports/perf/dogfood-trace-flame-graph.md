# Perf Suite — dogfood-trace-flame-graph

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| loadTrace | 0.00038ms | 0.0024ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| renderFlame | 0.00058ms | 0.0018ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| drillDown | 0.00054ms | 0.0052ms | 20ms | 0.00033ms | PASS | stable (p10 -0% (閾値未満)、 p95 +21% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| loadTrace | 0.01ms | 40ms | PASS |
| renderFlame | 0.01ms | 60ms | PASS |
| drillDown | 0.01ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| loadTrace | 8464 B | -36263 B | 102400 B | yes | PASS |
| renderFlame | 17496 B | 0 B | 102400 B | yes | PASS |
| drillDown | 41024 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### loadTrace

# Perf Report — loadTrace.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.0024ms |
| p99 | 0.0035ms |
| mean | 0.00066ms |
| stdev | 0.00074ms |
| min | 0.00038ms |
| max | 0.0038ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| p50 | 0.00042ms | 0.00046ms | -0.000043ms | -9.37% |
| p95 | 0.0024ms | 0.0027ms | -0.00030ms | -11.13% |
| p99 | 0.0035ms | 0.0036ms | -0.000064ms | -1.78% |
| mean | 0.00066ms | 0.00071ms | -0.000054ms | -7.63% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.0038ms | 0.0041ms | -0.00029ms | -7.08% |
| total | 0.03ms | 0.03ms | -0.0022ms | -7.63% |

### renderFlame

# Perf Report — renderFlame.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.00063ms |
| p95 | 0.0018ms |
| p99 | 0.0044ms |
| mean | 0.00090ms |
| stdev | 0.00083ms |
| min | 0.00058ms |
| max | 0.0050ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00058ms | 0.00058ms | 0.00ms | 0.00% |
| p50 | 0.00063ms | 0.00063ms | 0.00ms | 0.00% |
| p95 | 0.0018ms | 0.0017ms | +0.00016ms | +9.86% |
| p99 | 0.0044ms | 0.0040ms | +0.00035ms | +8.75% |
| mean | 0.00090ms | 0.00086ms | +0.000034ms | +3.99% |
| min | 0.00058ms | 0.00058ms | 0.00ms | 0.00% |
| max | 0.0050ms | 0.0045ms | +0.00050ms | +11.19% |
| total | 0.04ms | 0.03ms | +0.0014ms | +3.99% |

### drillDown

# Perf Report — drillDown.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00054ms |
| p95 | 0.0052ms |
| p99 | 0.0074ms |
| mean | 0.0012ms |
| stdev | 0.0017ms |
| min | 0.00054ms |
| max | 0.0081ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00054ms | -0.0000010ms | -0.18% |
| p50 | 0.00054ms | 0.00058ms | -0.000041ms | -7.03% |
| p95 | 0.0052ms | 0.0043ms | +0.00091ms | +21.17% |
| p99 | 0.0074ms | 0.0060ms | +0.0014ms | +24.13% |
| mean | 0.0012ms | 0.0011ms | +0.000055ms | +5.02% |
| min | 0.00054ms | 0.00054ms | -0.0000010ms | -0.18% |
| max | 0.0081ms | 0.0063ms | +0.0018ms | +29.15% |
| total | 0.05ms | 0.04ms | +0.0022ms | +5.02% |

