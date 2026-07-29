# Perf Suite — state

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| createStore | 0.00029ms | 0.0017ms | 5ms | 0.00033ms | PASS | stable (p10 -12% (閾値未満)、 p95 +264% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| dispatch | 0.00046ms | 0.00058ms | 5ms | 0.00033ms | PASS | stable (差 0.00012ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| selectState | 0.00021ms | 0.00029ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +160%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createStore | 0.01ms | 10ms | PASS |
| dispatch | 0.01ms | 10ms | PASS |
| selectState | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| createStore | -9072 B | 0 B | 102400 B | yes | PASS |
| dispatch | -11488 B | 0 B | 102400 B | yes | PASS |
| selectState | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### createStore

# Perf Report — createStore.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.0017ms |
| p99 | 0.0035ms |
| mean | 0.00055ms |
| stdev | 0.00068ms |
| min | 0.00025ms |
| max | 0.0060ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00033ms | -0.000041ms | -12.31% |
| p50 | 0.00033ms | 0.00033ms | -0.0000010ms | -0.30% |
| p95 | 0.0017ms | 0.00046ms | +0.0012ms | +263.72% |
| p99 | 0.0035ms | 0.0029ms | +0.00058ms | +19.99% |
| mean | 0.00055ms | 0.00044ms | +0.00011ms | +24.49% |
| min | 0.00025ms | 0.00029ms | -0.000041ms | -14.09% |
| max | 0.0060ms | 0.0059ms | +0.000042ms | +0.71% |
| total | 0.11ms | 0.09ms | +0.02ms | +24.49% |

### dispatch

# Perf Report — dispatch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.00058ms |
| p99 | 0.0041ms |
| mean | 0.00064ms |
| stdev | 0.00097ms |
| min | 0.00046ms |
| max | 0.01ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00058ms | -0.00012ms | -21.44% |
| p50 | 0.00050ms | 0.00058ms | -0.000084ms | -14.38% |
| p95 | 0.00058ms | 0.00071ms | -0.00013ms | -17.99% |
| p99 | 0.0041ms | 0.0044ms | -0.00029ms | -6.56% |
| mean | 0.00064ms | 0.00075ms | -0.00011ms | -14.25% |
| min | 0.00046ms | 0.00054ms | -0.000083ms | -15.34% |
| max | 0.01ms | 0.01ms | +0.00075ms | +6.57% |
| total | 0.13ms | 0.15ms | -0.02ms | -14.25% |

### selectState

# Perf Report — selectState.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00021ms |
| p95 | 0.00029ms |
| p99 | 0.0016ms |
| mean | 0.00028ms |
| stdev | 0.00050ms |
| min | 0.00021ms |
| max | 0.0063ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p50 | 0.00021ms | 0.00025ms | -0.000041ms | -16.40% |
| p95 | 0.00029ms | 0.00025ms | +0.000040ms | +15.83% |
| p99 | 0.0016ms | 0.0012ms | +0.00049ms | +41.87% |
| mean | 0.00028ms | 0.00031ms | -0.000026ms | -8.44% |
| min | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| max | 0.0063ms | 0.0092ms | -0.0030ms | -31.98% |
| total | 0.06ms | 0.06ms | -0.0053ms | -8.44% |

