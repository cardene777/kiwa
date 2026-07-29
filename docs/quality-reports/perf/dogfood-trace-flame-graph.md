# Perf Suite — dogfood-trace-flame-graph

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| loadTrace | 0.00038ms | 0.0023ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| renderFlame | 0.00050ms | 0.0016ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| drillDown | 0.00050ms | 0.0058ms | 20ms | 0.00033ms | PASS | stable (p10 -8% (閾値未満)、 p95 +34% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| loadTrace | 0.02ms | 40ms | PASS |
| renderFlame | 0.01ms | 60ms | PASS |
| drillDown | 0.01ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| loadTrace | 14488 B | -36259 B | 102400 B | yes | PASS |
| renderFlame | 25632 B | 0 B | 102400 B | yes | PASS |
| drillDown | 37832 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### loadTrace

# Perf Report — loadTrace.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.0023ms |
| p99 | 0.0038ms |
| mean | 0.00067ms |
| stdev | 0.00077ms |
| min | 0.00038ms |
| max | 0.0042ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| p50 | 0.00042ms | 0.00046ms | -0.000042ms | -9.15% |
| p95 | 0.0023ms | 0.0027ms | -0.00042ms | -15.43% |
| p99 | 0.0038ms | 0.0036ms | +0.00016ms | +4.31% |
| mean | 0.00067ms | 0.00071ms | -0.000044ms | -6.12% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.0042ms | 0.0041ms | +0.000042ms | +1.02% |
| total | 0.03ms | 0.03ms | -0.0017ms | -6.12% |

### renderFlame

# Perf Report — renderFlame.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.0016ms |
| p99 | 0.0053ms |
| mean | 0.00086ms |
| stdev | 0.0010ms |
| min | 0.00050ms |
| max | 0.0064ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00058ms | -0.000083ms | -14.24% |
| p50 | 0.00054ms | 0.00063ms | -0.000083ms | -13.28% |
| p95 | 0.0016ms | 0.0017ms | -0.00011ms | -6.67% |
| p99 | 0.0053ms | 0.0040ms | +0.0012ms | +30.80% |
| mean | 0.00086ms | 0.00086ms | -0.0000073ms | -0.85% |
| min | 0.00050ms | 0.00058ms | -0.000083ms | -14.24% |
| max | 0.0064ms | 0.0045ms | +0.0020ms | +43.91% |
| total | 0.03ms | 0.03ms | -0.00029ms | -0.85% |

### drillDown

# Perf Report — drillDown.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.0058ms |
| p99 | 0.0063ms |
| mean | 0.0011ms |
| stdev | 0.0015ms |
| min | 0.00050ms |
| max | 0.0064ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00054ms | -0.000042ms | -7.75% |
| p50 | 0.00054ms | 0.00058ms | -0.000041ms | -7.03% |
| p95 | 0.0058ms | 0.0043ms | +0.0015ms | +33.91% |
| p99 | 0.0063ms | 0.0060ms | +0.00034ms | +5.75% |
| mean | 0.0011ms | 0.0011ms | -0.000012ms | -1.13% |
| min | 0.00050ms | 0.00054ms | -0.000042ms | -7.75% |
| max | 0.0064ms | 0.0063ms | +0.000084ms | +1.34% |
| total | 0.04ms | 0.04ms | -0.00050ms | -1.13% |

