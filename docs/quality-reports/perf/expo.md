# Perf Suite — expo

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| createExpoTestEnv | 0.00083ms | 0.0024ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| routerPushCycle | 0.00054ms | 0.0011ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| notificationDispatch | 0.0013ms | 0.0020ms | 5ms | 0.00033ms | PASS | regressed — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createExpoTestEnv | 0.03ms | 10ms | PASS |
| routerPushCycle | 0.02ms | 10ms | PASS |
| notificationDispatch | 0.03ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| createExpoTestEnv | -10496 B | 0 B | 102400 B | yes | PASS |
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
| p50 | 0.00088ms |
| p95 | 0.0024ms |
| p99 | 0.0084ms |
| mean | 0.0014ms |
| stdev | 0.0021ms |
| min | 0.00079ms |
| max | 0.03ms |
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00083ms | 0.00083ms | 0.00ms | 0.00% |
| p50 | 0.00088ms | 0.00098ms | -0.00010ms | -10.62% |
| p95 | 0.0024ms | 0.0039ms | -0.0015ms | -37.69% |
| p99 | 0.0084ms | 0.0079ms | +0.00056ms | +7.09% |
| mean | 0.0014ms | 0.0017ms | -0.00030ms | -17.45% |
| min | 0.00079ms | 0.00079ms | 0.00ms | 0.00% |
| max | 0.03ms | 0.02ms | +0.0020ms | +8.88% |
| total | 0.29ms | 0.35ms | -0.06ms | -17.45% |

### routerPushCycle

# Perf Report — routerPushCycle.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00054ms |
| p95 | 0.0011ms |
| p99 | 0.0089ms |
| mean | 0.00090ms |
| stdev | 0.0030ms |
| min | 0.00050ms |
| max | 0.04ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00050ms | +0.000041ms | +8.20% |
| p50 | 0.00054ms | 0.00054ms | +0.0000010ms | +0.18% |
| p95 | 0.0011ms | 0.0011ms | +0.0000021ms | +0.19% |
| p99 | 0.0089ms | 0.0047ms | +0.0042ms | +88.24% |
| mean | 0.00090ms | 0.00067ms | +0.00023ms | +33.98% |
| min | 0.00050ms | 0.00046ms | +0.000042ms | +9.17% |
| max | 0.04ms | 0.0062ms | +0.03ms | +538.29% |
| total | 0.18ms | 0.13ms | +0.05ms | +33.98% |

### notificationDispatch

# Perf Report — notificationDispatch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0013ms |
| p50 | 0.0014ms |
| p95 | 0.0020ms |
| p99 | 0.0077ms |
| mean | 0.0017ms |
| stdev | 0.0025ms |
| min | 0.0013ms |
| max | 0.03ms |
| total | 0.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0013ms | 0.00046ms | +0.00087ms | +191.05% |
| p50 | 0.0014ms | 0.00050ms | +0.00087ms | +175.00% |
| p95 | 0.0020ms | 0.00088ms | +0.0012ms | +131.60% |
| p99 | 0.0077ms | 0.0028ms | +0.0049ms | +172.07% |
| mean | 0.0017ms | 0.00063ms | +0.0011ms | +179.18% |
| min | 0.0013ms | 0.00046ms | +0.00083ms | +181.88% |
| max | 0.03ms | 0.0092ms | +0.02ms | +253.37% |
| total | 0.35ms | 0.13ms | +0.22ms | +179.18% |

