# Perf Suite — state

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| createStore | 0.00025ms | 0.0013ms | 5ms | 0.00033ms | PASS | stable (差 0.000083ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| dispatch | 0.00046ms | 0.00059ms | 5ms | 0.00033ms | PASS | stable (差 0.00012ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| selectState | 0.00021ms | 0.00025ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +160%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createStore | 0.01ms | 10ms | PASS |
| dispatch | 0.01ms | 10ms | PASS |
| selectState | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| createStore | 307128 B | 0 B | 102400 B | yes | PASS |
| dispatch | 560 B | 0 B | 102400 B | yes | PASS |
| selectState | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### createStore

# Perf Report — createStore.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00033ms |
| p95 | 0.0013ms |
| p99 | 0.0033ms |
| mean | 0.00046ms |
| stdev | 0.00063ms |
| min | 0.00025ms |
| max | 0.0058ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00033ms | -0.000083ms | -24.92% |
| p50 | 0.00033ms | 0.00033ms | -0.0000010ms | -0.30% |
| p95 | 0.0013ms | 0.00046ms | +0.00088ms | +191.92% |
| p99 | 0.0033ms | 0.0029ms | +0.00042ms | +14.50% |
| mean | 0.00046ms | 0.00044ms | +0.000018ms | +4.02% |
| min | 0.00025ms | 0.00029ms | -0.000041ms | -14.09% |
| max | 0.0058ms | 0.0059ms | -0.00013ms | -2.11% |
| total | 0.09ms | 0.09ms | +0.0035ms | +4.02% |

### dispatch

# Perf Report — dispatch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.00059ms |
| p99 | 0.0048ms |
| mean | 0.00066ms |
| stdev | 0.0010ms |
| min | 0.00046ms |
| max | 0.01ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00058ms | -0.00012ms | -21.44% |
| p50 | 0.00050ms | 0.00058ms | -0.000084ms | -14.38% |
| p95 | 0.00059ms | 0.00071ms | -0.00013ms | -17.71% |
| p99 | 0.0048ms | 0.0044ms | +0.00037ms | +8.41% |
| mean | 0.00066ms | 0.00075ms | -0.000090ms | -11.92% |
| min | 0.00046ms | 0.00054ms | -0.000083ms | -15.34% |
| max | 0.01ms | 0.01ms | +0.0015ms | +13.51% |
| total | 0.13ms | 0.15ms | -0.02ms | -11.92% |

### selectState

# Perf Report — selectState.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00021ms |
| p95 | 0.00025ms |
| p99 | 0.0015ms |
| mean | 0.00029ms |
| stdev | 0.00051ms |
| min | 0.00021ms |
| max | 0.0064ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p50 | 0.00021ms | 0.00025ms | -0.000041ms | -16.40% |
| p95 | 0.00025ms | 0.00025ms | -0.0000021ms | -0.83% |
| p99 | 0.0015ms | 0.0012ms | +0.00032ms | +27.63% |
| mean | 0.00029ms | 0.00031ms | -0.000025ms | -8.10% |
| min | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| max | 0.0064ms | 0.0092ms | -0.0028ms | -30.64% |
| total | 0.06ms | 0.06ms | -0.0050ms | -8.10% |

