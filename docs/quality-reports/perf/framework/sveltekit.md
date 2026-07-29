# Perf Suite — sveltekit

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeLoad | 0.00075ms | 0.0025ms | 5ms | 0.00033ms | PASS | stable (p10 +12% (閾値未満)、 p95 +65% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| invokeAction | 0.01ms | 0.16ms | 5ms | 0.00033ms | PASS | stable (p10 +14% (閾値未満)、 p95 +466% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeLoad | 0.03ms | 10ms | PASS |
| invokeAction | 4.22ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeLoad | -9216 B | 0 B | 102400 B | yes | PASS |
| invokeAction | -79592 B | -41420 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeLoad

# Perf Report — invokeLoad.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00075ms |
| p50 | 0.00083ms |
| p95 | 0.0025ms |
| p99 | 0.0072ms |
| mean | 0.0011ms |
| stdev | 0.0012ms |
| min | 0.00067ms |
| max | 0.01ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00075ms | 0.00067ms | +0.000083ms | +12.44% |
| p50 | 0.00083ms | 0.00071ms | +0.00012ms | +17.49% |
| p95 | 0.0025ms | 0.0015ms | +0.00096ms | +64.50% |
| p99 | 0.0072ms | 0.0073ms | -0.00019ms | -2.62% |
| mean | 0.0011ms | 0.00098ms | +0.00010ms | +10.68% |
| min | 0.00067ms | 0.00063ms | +0.000041ms | +6.56% |
| max | 0.01ms | 0.0098ms | +0.0025ms | +25.96% |
| total | 0.22ms | 0.20ms | +0.02ms | +10.68% |

### invokeAction

# Perf Report — invokeAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.16ms |
| p99 | 0.26ms |
| mean | 0.04ms |
| stdev | 0.06ms |
| min | 0.01ms |
| max | 0.48ms |
| total | 8.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.0015ms | +13.61% |
| p50 | 0.02ms | 0.01ms | +0.0078ms | +68.37% |
| p95 | 0.16ms | 0.03ms | +0.13ms | +465.72% |
| p99 | 0.26ms | 0.11ms | +0.15ms | +138.62% |
| mean | 0.04ms | 0.02ms | +0.03ms | +168.52% |
| min | 0.01ms | 0.01ms | +0.0014ms | +13.81% |
| max | 0.48ms | 0.13ms | +0.35ms | +278.34% |
| total | 8.37ms | 3.12ms | +5.25ms | +168.52% |

