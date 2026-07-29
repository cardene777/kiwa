# Perf Suite — expo

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| createExpoTestEnv | 0.00083ms | 0.0028ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| routerPushCycle | 0.00046ms | 0.00088ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| notificationDispatch | 0.00046ms | 0.00075ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createExpoTestEnv | 0.02ms | 10ms | PASS |
| routerPushCycle | 0.02ms | 10ms | PASS |
| notificationDispatch | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| createExpoTestEnv | -10360 B | 0 B | 102400 B | yes | PASS |
| routerPushCycle | -16296 B | 0 B | 102400 B | yes | PASS |
| notificationDispatch | 592 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### createExpoTestEnv

# Perf Report — createExpoTestEnv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00083ms |
| p50 | 0.0014ms |
| p95 | 0.0028ms |
| p99 | 0.01ms |
| mean | 0.0017ms |
| stdev | 0.0023ms |
| min | 0.00079ms |
| max | 0.02ms |
| total | 0.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00083ms | 0.00083ms | 0.00ms | 0.00% |
| p50 | 0.0014ms | 0.00098ms | +0.00040ms | +40.45% |
| p95 | 0.0028ms | 0.0039ms | -0.0011ms | -27.64% |
| p99 | 0.01ms | 0.0079ms | +0.0024ms | +30.51% |
| mean | 0.0017ms | 0.0017ms | +0.0000086ms | +0.49% |
| min | 0.00079ms | 0.00079ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.02ms | +0.0018ms | +7.97% |
| total | 0.35ms | 0.35ms | +0.0017ms | +0.49% |

### routerPushCycle

# Perf Report — routerPushCycle.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.00088ms |
| p99 | 0.0056ms |
| mean | 0.0013ms |
| stdev | 0.0089ms |
| min | 0.00046ms |
| max | 0.13ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| p50 | 0.00050ms | 0.00054ms | -0.000041ms | -7.58% |
| p95 | 0.00088ms | 0.0011ms | -0.00022ms | -19.79% |
| p99 | 0.0056ms | 0.0047ms | +0.00091ms | +19.22% |
| mean | 0.0013ms | 0.00067ms | +0.00059ms | +87.33% |
| min | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| max | 0.13ms | 0.0062ms | +0.12ms | +1936.34% |
| total | 0.25ms | 0.13ms | +0.12ms | +87.33% |

### notificationDispatch

# Perf Report — notificationDispatch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.00075ms |
| p99 | 0.0029ms |
| mean | 0.00060ms |
| stdev | 0.00064ms |
| min | 0.00046ms |
| max | 0.0070ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p50 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p95 | 0.00075ms | 0.00088ms | -0.00013ms | -14.25% |
| p99 | 0.0029ms | 0.0028ms | +0.000039ms | +1.38% |
| mean | 0.00060ms | 0.00063ms | -0.000024ms | -3.87% |
| min | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| max | 0.0070ms | 0.0092ms | -0.0022ms | -23.99% |
| total | 0.12ms | 0.13ms | -0.0048ms | -3.87% |

