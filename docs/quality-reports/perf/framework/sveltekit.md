# Perf Suite — sveltekit

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeLoad | 0.00063ms | 0.0018ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeAction | 0.01ms | 0.04ms | 5ms | 0.00033ms | PASS | stable (p10 -1% (閾値未満)、 p95 +39% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeLoad | 0.02ms | 10ms | PASS |
| invokeAction | 0.19ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeLoad | -9280 B | 0 B | 102400 B | yes | PASS |
| invokeAction | -97960 B | -37696 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeLoad

# Perf Report — invokeLoad.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00063ms |
| p50 | 0.00071ms |
| p95 | 0.0018ms |
| p99 | 0.0056ms |
| mean | 0.00096ms |
| stdev | 0.0011ms |
| min | 0.00063ms |
| max | 0.0098ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00063ms | 0.00067ms | -0.000042ms | -6.30% |
| p50 | 0.00071ms | 0.00071ms | -0.0000010ms | -0.14% |
| p95 | 0.0018ms | 0.0015ms | +0.00028ms | +18.55% |
| p99 | 0.0056ms | 0.0073ms | -0.0017ms | -23.59% |
| mean | 0.00096ms | 0.00098ms | -0.000023ms | -2.31% |
| min | 0.00063ms | 0.00063ms | 0.00ms | 0.00% |
| max | 0.0098ms | 0.0098ms | +0.000042ms | +0.43% |
| total | 0.19ms | 0.20ms | -0.0045ms | -2.31% |

### invokeAction

# Perf Report — invokeAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.04ms |
| p99 | 0.09ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.13ms |
| total | 3.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.000084ms | -0.78% |
| p50 | 0.01ms | 0.01ms | 0.00ms | 0.00% |
| p95 | 0.04ms | 0.03ms | +0.01ms | +39.02% |
| p99 | 0.09ms | 0.11ms | -0.02ms | -21.29% |
| mean | 0.02ms | 0.02ms | +0.00072ms | +4.60% |
| min | 0.01ms | 0.01ms | +0.000042ms | +0.41% |
| max | 0.13ms | 0.13ms | +0.0053ms | +4.24% |
| total | 3.26ms | 3.12ms | +0.14ms | +4.60% |

