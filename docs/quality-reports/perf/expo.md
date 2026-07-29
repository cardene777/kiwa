# Perf Suite — expo

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| createExpoTestEnv | 0.00083ms | 0.0057ms | 5ms | 0.00033ms | PASS | stable (p10 0% (閾値未満)、 p95 +47% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| routerPushCycle | 0.00046ms | 0.00084ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| notificationDispatch | 0.00046ms | 0.00084ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createExpoTestEnv | 0.03ms | 10ms | PASS |
| routerPushCycle | 0.01ms | 10ms | PASS |
| notificationDispatch | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| createExpoTestEnv | -14144 B | 0 B | 102400 B | yes | PASS |
| routerPushCycle | -16448 B | 0 B | 102400 B | yes | PASS |
| notificationDispatch | 592 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### createExpoTestEnv

# Perf Report — createExpoTestEnv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00083ms |
| p50 | 0.0013ms |
| p95 | 0.0057ms |
| p99 | 0.02ms |
| mean | 0.0018ms |
| stdev | 0.0027ms |
| min | 0.00079ms |
| max | 0.03ms |
| total | 0.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00083ms | 0.00083ms | 0.00ms | 0.00% |
| p50 | 0.0013ms | 0.00098ms | +0.00027ms | +27.68% |
| p95 | 0.0057ms | 0.0039ms | +0.0018ms | +47.21% |
| p99 | 0.02ms | 0.0079ms | +0.0093ms | +118.54% |
| mean | 0.0018ms | 0.0017ms | +0.000071ms | +4.09% |
| min | 0.00079ms | 0.00079ms | 0.00ms | 0.00% |
| max | 0.03ms | 0.02ms | +0.0020ms | +8.70% |
| total | 0.36ms | 0.35ms | +0.01ms | +4.09% |

### routerPushCycle

# Perf Report — routerPushCycle.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.00084ms |
| p99 | 0.0050ms |
| mean | 0.00061ms |
| stdev | 0.00065ms |
| min | 0.00046ms |
| max | 0.0057ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| p50 | 0.00050ms | 0.00054ms | -0.000041ms | -7.58% |
| p95 | 0.00084ms | 0.0011ms | -0.00026ms | -23.54% |
| p99 | 0.0050ms | 0.0047ms | +0.00024ms | +5.17% |
| mean | 0.00061ms | 0.00067ms | -0.000057ms | -8.51% |
| min | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| max | 0.0057ms | 0.0062ms | -0.00046ms | -7.38% |
| total | 0.12ms | 0.13ms | -0.01ms | -8.51% |

### notificationDispatch

# Perf Report — notificationDispatch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.00084ms |
| p99 | 0.0061ms |
| mean | 0.00071ms |
| stdev | 0.0015ms |
| min | 0.00046ms |
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p50 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p95 | 0.00084ms | 0.00088ms | -0.000034ms | -3.84% |
| p99 | 0.0061ms | 0.0028ms | +0.0033ms | +116.05% |
| mean | 0.00071ms | 0.00063ms | +0.000088ms | +14.03% |
| min | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.0092ms | +0.0077ms | +83.70% |
| total | 0.14ms | 0.13ms | +0.02ms | +14.03% |

