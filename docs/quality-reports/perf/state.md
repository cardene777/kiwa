# Perf Suite — state

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| createStore | 0.00033ms | 0.00060ms | 5ms | 0.00033ms | PASS | stable (p10 0% (閾値未満)、 p95 +30% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| dispatch | 0.00038ms | 0.0015ms | 5ms | 0.00033ms | PASS | stable (差 0.00021ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| selectState | 0.00021ms | 0.00029ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +160%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createStore | 0.01ms | 10ms | PASS |
| dispatch | 0.02ms | 10ms | PASS |
| selectState | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| createStore | -3480 B | 0 B | 102400 B | yes | PASS |
| dispatch | 440 B | 0 B | 102400 B | yes | PASS |
| selectState | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### createStore

# Perf Report — createStore.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.00060ms |
| p99 | 0.0033ms |
| mean | 0.00048ms |
| stdev | 0.00061ms |
| min | 0.00029ms |
| max | 0.0063ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| p50 | 0.00038ms | 0.00033ms | +0.000041ms | +12.28% |
| p95 | 0.00060ms | 0.00046ms | +0.00014ms | +30.02% |
| p99 | 0.0033ms | 0.0029ms | +0.00038ms | +13.06% |
| mean | 0.00048ms | 0.00044ms | +0.000039ms | +8.85% |
| min | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| max | 0.0063ms | 0.0059ms | +0.00037ms | +6.32% |
| total | 0.10ms | 0.09ms | +0.0078ms | +8.85% |

### dispatch

# Perf Report — dispatch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.0015ms |
| p99 | 0.02ms |
| mean | 0.00087ms |
| stdev | 0.0023ms |
| min | 0.00038ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00058ms | -0.00021ms | -35.68% |
| p50 | 0.00042ms | 0.00058ms | -0.00017ms | -28.60% |
| p95 | 0.0015ms | 0.00071ms | +0.00079ms | +111.51% |
| p99 | 0.02ms | 0.0044ms | +0.01ms | +278.11% |
| mean | 0.00087ms | 0.00075ms | +0.00012ms | +15.47% |
| min | 0.00038ms | 0.00054ms | -0.00017ms | -30.68% |
| max | 0.02ms | 0.01ms | +0.0094ms | +82.11% |
| total | 0.17ms | 0.15ms | +0.02ms | +15.47% |

### selectState

# Perf Report — selectState.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00025ms |
| p95 | 0.00029ms |
| p99 | 0.0030ms |
| mean | 0.00037ms |
| stdev | 0.0012ms |
| min | 0.00021ms |
| max | 0.02ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p50 | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| p95 | 0.00029ms | 0.00025ms | +0.000042ms | +16.64% |
| p99 | 0.0030ms | 0.0012ms | +0.0019ms | +159.96% |
| mean | 0.00037ms | 0.00031ms | +0.000060ms | +19.29% |
| min | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.0092ms | +0.0065ms | +70.72% |
| total | 0.07ms | 0.06ms | +0.01ms | +19.29% |

