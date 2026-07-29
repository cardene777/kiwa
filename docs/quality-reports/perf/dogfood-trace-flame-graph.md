# Perf Suite — dogfood-trace-flame-graph

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| loadTrace | 0.00042ms | 0.0030ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| renderFlame | 0.00050ms | 0.0015ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| drillDown | 0.00054ms | 0.0052ms | 20ms | 0.00033ms | PASS | stable (p10 -0% (閾値未満)、 p95 +21% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| loadTrace | 0.01ms | 40ms | PASS |
| renderFlame | 0.01ms | 60ms | PASS |
| drillDown | 0.02ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| loadTrace | -233424 B | -36252 B | 102400 B | yes | PASS |
| renderFlame | 18440 B | 0 B | 102400 B | yes | PASS |
| drillDown | 40504 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### loadTrace

# Perf Report — loadTrace.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00042ms |
| p95 | 0.0030ms |
| p99 | 0.0059ms |
| mean | 0.00085ms |
| stdev | 0.0013ms |
| min | 0.00038ms |
| max | 0.0072ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p50 | 0.00042ms | 0.00046ms | -0.000042ms | -9.15% |
| p95 | 0.0030ms | 0.0027ms | +0.00025ms | +9.39% |
| p99 | 0.0059ms | 0.0036ms | +0.0023ms | +63.64% |
| mean | 0.00085ms | 0.00071ms | +0.00014ms | +20.06% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.0072ms | 0.0041ms | +0.0030ms | +73.75% |
| total | 0.03ms | 0.03ms | +0.0057ms | +20.06% |

### renderFlame

# Perf Report — renderFlame.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.0015ms |
| p99 | 0.0042ms |
| mean | 0.00079ms |
| stdev | 0.00081ms |
| min | 0.00050ms |
| max | 0.0052ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00058ms | -0.000083ms | -14.24% |
| p50 | 0.00054ms | 0.00063ms | -0.000083ms | -13.28% |
| p95 | 0.0015ms | 0.0017ms | -0.00015ms | -9.03% |
| p99 | 0.0042ms | 0.0040ms | +0.00020ms | +4.88% |
| mean | 0.00079ms | 0.00086ms | -0.000070ms | -8.09% |
| min | 0.00050ms | 0.00058ms | -0.000083ms | -14.24% |
| max | 0.0052ms | 0.0045ms | +0.00075ms | +16.80% |
| total | 0.03ms | 0.03ms | -0.0028ms | -8.09% |

### drillDown

# Perf Report — drillDown.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00058ms |
| p95 | 0.0052ms |
| p99 | 0.0067ms |
| mean | 0.0011ms |
| stdev | 0.0015ms |
| min | 0.00050ms |
| max | 0.0067ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00054ms | -1.0e-7ms | -0.02% |
| p50 | 0.00058ms | 0.00058ms | +5.0e-7ms | +0.09% |
| p95 | 0.0052ms | 0.0043ms | +0.00089ms | +20.63% |
| p99 | 0.0067ms | 0.0060ms | +0.00068ms | +11.43% |
| mean | 0.0011ms | 0.0011ms | +0.000040ms | +3.61% |
| min | 0.00050ms | 0.00054ms | -0.000042ms | -7.75% |
| max | 0.0067ms | 0.0063ms | +0.00038ms | +5.98% |
| total | 0.05ms | 0.04ms | +0.0016ms | +3.61% |

