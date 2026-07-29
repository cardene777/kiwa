# Perf Suite — expo

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| createExpoTestEnv | 0.00083ms | 0.0029ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| routerPushCycle | 0.00050ms | 0.0012ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| notificationDispatch | 0.00046ms | 0.0011ms | 5ms | 0.00033ms | PASS | stable (p10 0% (閾値未満)、 p95 +29% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createExpoTestEnv | 0.03ms | 10ms | PASS |
| routerPushCycle | 0.02ms | 10ms | PASS |
| notificationDispatch | 0.03ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| createExpoTestEnv | -14064 B | 0 B | 102400 B | yes | PASS |
| routerPushCycle | -16296 B | 0 B | 102400 B | yes | PASS |
| notificationDispatch | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### createExpoTestEnv

# Perf Report — createExpoTestEnv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00083ms |
| p50 | 0.00092ms |
| p95 | 0.0029ms |
| p99 | 0.01ms |
| mean | 0.0016ms |
| stdev | 0.0025ms |
| min | 0.00079ms |
| max | 0.03ms |
| total | 0.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00083ms | 0.00083ms | 0.00ms | 0.00% |
| p50 | 0.00092ms | 0.00098ms | -0.000063ms | -6.44% |
| p95 | 0.0029ms | 0.0039ms | -0.00095ms | -24.60% |
| p99 | 0.01ms | 0.0079ms | +0.0052ms | +66.00% |
| mean | 0.0016ms | 0.0017ms | -0.00018ms | -10.51% |
| min | 0.00079ms | 0.00079ms | 0.00ms | 0.00% |
| max | 0.03ms | 0.02ms | +0.0034ms | +14.86% |
| total | 0.31ms | 0.35ms | -0.04ms | -10.51% |

### routerPushCycle

# Perf Report — routerPushCycle.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00050ms |
| p95 | 0.0012ms |
| p99 | 0.0059ms |
| mean | 0.00066ms |
| stdev | 0.00070ms |
| min | 0.00046ms |
| max | 0.0063ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p50 | 0.00050ms | 0.00054ms | -0.000041ms | -7.58% |
| p95 | 0.0012ms | 0.0011ms | +0.000080ms | +7.30% |
| p99 | 0.0059ms | 0.0047ms | +0.0012ms | +25.33% |
| mean | 0.00066ms | 0.00067ms | -0.0000095ms | -1.42% |
| min | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| max | 0.0063ms | 0.0062ms | +0.000042ms | +0.68% |
| total | 0.13ms | 0.13ms | -0.0019ms | -1.42% |

### notificationDispatch

# Perf Report — notificationDispatch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.0011ms |
| p99 | 0.0038ms |
| mean | 0.00070ms |
| stdev | 0.0013ms |
| min | 0.00046ms |
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p50 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p95 | 0.0011ms | 0.00088ms | +0.00025ms | +28.74% |
| p99 | 0.0038ms | 0.0028ms | +0.00095ms | +33.59% |
| mean | 0.00070ms | 0.00063ms | +0.000076ms | +12.10% |
| min | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.0092ms | +0.0088ms | +95.92% |
| total | 0.14ms | 0.13ms | +0.02ms | +12.10% |

