# Perf Suite — expo

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| createExpoTestEnv | 0.00083ms | 0.0026ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| routerPushCycle | 0.00054ms | 0.0012ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| notificationDispatch | 0.00054ms | 0.0010ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createExpoTestEnv | 0.02ms | 10ms | PASS |
| routerPushCycle | 0.02ms | 10ms | PASS |
| notificationDispatch | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| createExpoTestEnv | -195120 B | 0 B | 102400 B | yes | PASS |
| routerPushCycle | -296 B | 0 B | 102400 B | yes | PASS |
| notificationDispatch | -14008 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### createExpoTestEnv

# Perf Report — createExpoTestEnv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00083ms |
| p50 | 0.00096ms |
| p95 | 0.0026ms |
| p99 | 0.01ms |
| mean | 0.0015ms |
| stdev | 0.0024ms |
| min | 0.00079ms |
| max | 0.02ms |
| total | 0.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00083ms | 0.00083ms | 0.00ms | 0.00% |
| p50 | 0.00096ms | 0.00098ms | -0.000021ms | -2.15% |
| p95 | 0.0026ms | 0.0039ms | -0.0013ms | -33.17% |
| p99 | 0.01ms | 0.0079ms | +0.0045ms | +57.52% |
| mean | 0.0015ms | 0.0017ms | -0.00019ms | -10.69% |
| min | 0.00079ms | 0.00079ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.02ms | +0.0017ms | +7.43% |
| total | 0.31ms | 0.35ms | -0.04ms | -10.69% |

### routerPushCycle

# Perf Report — routerPushCycle.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00058ms |
| p95 | 0.0012ms |
| p99 | 0.0059ms |
| mean | 0.00071ms |
| stdev | 0.00078ms |
| min | 0.00046ms |
| max | 0.0070ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00050ms | +0.000041ms | +8.20% |
| p50 | 0.00058ms | 0.00054ms | +0.000042ms | +7.76% |
| p95 | 0.0012ms | 0.0011ms | +0.000088ms | +8.06% |
| p99 | 0.0059ms | 0.0047ms | +0.0012ms | +25.52% |
| mean | 0.00071ms | 0.00067ms | +0.000041ms | +6.09% |
| min | 0.00046ms | 0.00046ms | +0.0000010ms | +0.22% |
| max | 0.0070ms | 0.0062ms | +0.00083ms | +13.42% |
| total | 0.14ms | 0.13ms | +0.0082ms | +6.09% |

### notificationDispatch

# Perf Report — notificationDispatch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00054ms |
| p95 | 0.0010ms |
| p99 | 0.0047ms |
| mean | 0.00073ms |
| stdev | 0.0012ms |
| min | 0.00050ms |
| max | 0.02ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00046ms | +0.000083ms | +18.12% |
| p50 | 0.00054ms | 0.00050ms | +0.000042ms | +8.40% |
| p95 | 0.0010ms | 0.00088ms | +0.00013ms | +14.25% |
| p99 | 0.0047ms | 0.0028ms | +0.0019ms | +66.12% |
| mean | 0.00073ms | 0.00063ms | +0.00011ms | +17.07% |
| min | 0.00050ms | 0.00046ms | +0.000042ms | +9.17% |
| max | 0.02ms | 0.0092ms | +0.0064ms | +69.67% |
| total | 0.15ms | 0.13ms | +0.02ms | +17.07% |

