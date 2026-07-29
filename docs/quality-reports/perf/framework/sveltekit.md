# Perf Suite — sveltekit

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeLoad | 0.00067ms | 0.0023ms | 5ms | 0.00033ms | PASS | stable (p10 0% (閾値未満)、 p95 +56% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| invokeAction | 0.01ms | 0.04ms | 5ms | 0.00033ms | PASS | stable (p10 -1% (閾値未満)、 p95 +31% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeLoad | 0.02ms | 10ms | PASS |
| invokeAction | 0.33ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeLoad | -7592 B | 0 B | 102400 B | yes | PASS |
| invokeAction | -97048 B | -33022 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeLoad

# Perf Report — invokeLoad.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00067ms |
| p50 | 0.00079ms |
| p95 | 0.0023ms |
| p99 | 0.0083ms |
| mean | 0.0010ms |
| stdev | 0.0011ms |
| min | 0.00063ms |
| max | 0.0096ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00067ms | 0.00067ms | 0.00ms | 0.00% |
| p50 | 0.00079ms | 0.00071ms | +0.000082ms | +11.57% |
| p95 | 0.0023ms | 0.0015ms | +0.00084ms | +56.14% |
| p99 | 0.0083ms | 0.0073ms | +0.00099ms | +13.53% |
| mean | 0.0010ms | 0.00098ms | +0.000043ms | +4.40% |
| min | 0.00063ms | 0.00063ms | 0.00ms | 0.00% |
| max | 0.0096ms | 0.0098ms | -0.00021ms | -2.13% |
| total | 0.20ms | 0.20ms | +0.0086ms | +4.40% |

### invokeAction

# Perf Report — invokeAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.04ms |
| p99 | 0.08ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.11ms |
| total | 3.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00013ms | -1.17% |
| p50 | 0.01ms | 0.01ms | +0.00015ms | +1.28% |
| p95 | 0.04ms | 0.03ms | +0.0087ms | +31.45% |
| p99 | 0.08ms | 0.11ms | -0.03ms | -24.76% |
| mean | 0.02ms | 0.02ms | +0.00033ms | +2.15% |
| min | 0.01ms | 0.01ms | -0.000042ms | -0.41% |
| max | 0.11ms | 0.13ms | -0.02ms | -15.44% |
| total | 3.18ms | 3.12ms | +0.07ms | +2.15% |

