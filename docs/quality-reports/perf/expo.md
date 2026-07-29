# Perf Suite — expo

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| createExpoTestEnv | 0.00083ms | 0.0024ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| routerPushCycle | 0.00050ms | 0.0011ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| notificationDispatch | 0.00046ms | 0.0012ms | 5ms | 0.00033ms | PASS | stable (p10 0% (閾値未満)、 p95 +33% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createExpoTestEnv | 0.02ms | 10ms | PASS |
| routerPushCycle | 0.03ms | 10ms | PASS |
| notificationDispatch | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| createExpoTestEnv | -12792 B | 0 B | 102400 B | yes | PASS |
| routerPushCycle | -16448 B | 0 B | 102400 B | yes | PASS |
| notificationDispatch | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### createExpoTestEnv

# Perf Report — createExpoTestEnv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00083ms |
| p50 | 0.0013ms |
| p95 | 0.0024ms |
| p99 | 0.0086ms |
| mean | 0.0016ms |
| stdev | 0.0021ms |
| min | 0.00075ms |
| max | 0.02ms |
| total | 0.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00083ms | 0.00083ms | 0.00ms | 0.00% |
| p50 | 0.0013ms | 0.00098ms | +0.00035ms | +36.16% |
| p95 | 0.0024ms | 0.0039ms | -0.0014ms | -36.82% |
| p99 | 0.0086ms | 0.0079ms | +0.00071ms | +9.05% |
| mean | 0.0016ms | 0.0017ms | -0.00015ms | -8.90% |
| min | 0.00075ms | 0.00079ms | -0.000041ms | -5.18% |
| max | 0.02ms | 0.02ms | -0.0015ms | -6.34% |
| total | 0.32ms | 0.35ms | -0.03ms | -8.90% |

### routerPushCycle

# Perf Report — routerPushCycle.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00050ms |
| p95 | 0.0011ms |
| p99 | 0.0067ms |
| mean | 0.0011ms |
| stdev | 0.0059ms |
| min | 0.00046ms |
| max | 0.08ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p50 | 0.00050ms | 0.00054ms | -0.000041ms | -7.58% |
| p95 | 0.0011ms | 0.0011ms | +0.000040ms | +3.65% |
| p99 | 0.0067ms | 0.0047ms | +0.0019ms | +41.28% |
| mean | 0.0011ms | 0.00067ms | +0.00038ms | +57.40% |
| min | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| max | 0.08ms | 0.0062ms | +0.08ms | +1249.07% |
| total | 0.21ms | 0.13ms | +0.08ms | +57.40% |

### notificationDispatch

# Perf Report — notificationDispatch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.0012ms |
| p99 | 0.0050ms |
| mean | 0.0011ms |
| stdev | 0.0059ms |
| min | 0.00046ms |
| max | 0.08ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p50 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p95 | 0.0012ms | 0.00088ms | +0.00029ms | +33.19% |
| p99 | 0.0050ms | 0.0028ms | +0.0022ms | +76.70% |
| mean | 0.0011ms | 0.00063ms | +0.00044ms | +69.74% |
| min | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| max | 0.08ms | 0.0092ms | +0.07ms | +798.58% |
| total | 0.21ms | 0.13ms | +0.09ms | +69.74% |

