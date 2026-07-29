# Perf Suite — state

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| createStore | 0.00025ms | 0.0016ms | 5ms | 0.00033ms | PASS | stable (差 0.000083ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| dispatch | 0.00033ms | 0.00071ms | 5ms | 0.00033ms | PASS | stable (差 0.00025ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| selectState | 0.00021ms | 0.00033ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +160%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createStore | 0.01ms | 10ms | PASS |
| dispatch | 0.01ms | 10ms | PASS |
| selectState | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| createStore | 334864 B | 0 B | 102400 B | yes | PASS |
| dispatch | -15136 B | 0 B | 102400 B | yes | PASS |
| selectState | 360 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### createStore

# Perf Report — createStore.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00033ms |
| p95 | 0.0016ms |
| p99 | 0.0032ms |
| mean | 0.00053ms |
| stdev | 0.00064ms |
| min | 0.00025ms |
| max | 0.0050ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00033ms | -0.000083ms | -24.92% |
| p50 | 0.00033ms | 0.00033ms | -0.0000010ms | -0.30% |
| p95 | 0.0016ms | 0.00046ms | +0.0012ms | +256.13% |
| p99 | 0.0032ms | 0.0029ms | +0.00029ms | +10.06% |
| mean | 0.00053ms | 0.00044ms | +0.000091ms | +20.61% |
| min | 0.00025ms | 0.00029ms | -0.000041ms | -14.09% |
| max | 0.0050ms | 0.0059ms | -0.00092ms | -15.50% |
| total | 0.11ms | 0.09ms | +0.02ms | +20.61% |

### dispatch

# Perf Report — dispatch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00046ms |
| p95 | 0.00071ms |
| p99 | 0.0038ms |
| mean | 0.00059ms |
| stdev | 0.0011ms |
| min | 0.00025ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00058ms | -0.00025ms | -42.88% |
| p50 | 0.00046ms | 0.00058ms | -0.00013ms | -21.58% |
| p95 | 0.00071ms | 0.00071ms | +0.0000021ms | +0.30% |
| p99 | 0.0038ms | 0.0044ms | -0.00054ms | -12.27% |
| mean | 0.00059ms | 0.00075ms | -0.00016ms | -20.90% |
| min | 0.00025ms | 0.00054ms | -0.00029ms | -53.79% |
| max | 0.01ms | 0.01ms | +0.0029ms | +25.54% |
| total | 0.12ms | 0.15ms | -0.03ms | -20.90% |

### selectState

# Perf Report — selectState.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00021ms |
| p95 | 0.00033ms |
| p99 | 0.0019ms |
| mean | 0.00030ms |
| stdev | 0.00054ms |
| min | 0.00021ms |
| max | 0.0068ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p50 | 0.00021ms | 0.00025ms | -0.000041ms | -16.40% |
| p95 | 0.00033ms | 0.00025ms | +0.000081ms | +32.11% |
| p99 | 0.0019ms | 0.0012ms | +0.00078ms | +66.97% |
| mean | 0.00030ms | 0.00031ms | -0.000011ms | -3.47% |
| min | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| max | 0.0068ms | 0.0092ms | -0.0025ms | -26.57% |
| total | 0.06ms | 0.06ms | -0.0022ms | -3.47% |

