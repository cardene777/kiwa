# Perf Suite — state

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| createStore | 0.00029ms | 0.00092ms | 5ms | 0.00033ms | PASS | stable (p10 -14% (閾値未満)、 p95 +101% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| dispatch | 0.00029ms | 0.00071ms | 5ms | 0.00033ms | PASS | stable (差 0.00029ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
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
| createStore | 302608 B | 0 B | 102400 B | yes | PASS |
| dispatch | -15008 B | 0 B | 102400 B | yes | PASS |
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
| p95 | 0.00092ms |
| p99 | 0.0027ms |
| mean | 0.00044ms |
| stdev | 0.00053ms |
| min | 0.00025ms |
| max | 0.0050ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00033ms | -0.000046ms | -13.84% |
| p50 | 0.00033ms | 0.00033ms | -0.0000010ms | -0.30% |
| p95 | 0.00092ms | 0.00046ms | +0.00046ms | +101.10% |
| p99 | 0.0027ms | 0.0029ms | -0.00021ms | -7.21% |
| mean | 0.00044ms | 0.00044ms | -0.0000025ms | -0.57% |
| min | 0.00025ms | 0.00029ms | -0.000041ms | -14.09% |
| max | 0.0050ms | 0.0059ms | -0.00092ms | -15.50% |
| total | 0.09ms | 0.09ms | -0.00050ms | -0.57% |

### dispatch

# Perf Report — dispatch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00046ms |
| p95 | 0.00071ms |
| p99 | 0.0040ms |
| mean | 0.00058ms |
| stdev | 0.00095ms |
| min | 0.00029ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00058ms | -0.00029ms | -49.91% |
| p50 | 0.00046ms | 0.00058ms | -0.00013ms | -21.58% |
| p95 | 0.00071ms | 0.00071ms | +0.0000021ms | +0.29% |
| p99 | 0.0040ms | 0.0044ms | -0.00042ms | -9.59% |
| mean | 0.00058ms | 0.00075ms | -0.00018ms | -23.48% |
| min | 0.00029ms | 0.00054ms | -0.00025ms | -46.21% |
| max | 0.01ms | 0.01ms | +0.00033ms | +2.92% |
| total | 0.12ms | 0.15ms | -0.04ms | -23.48% |

### selectState

# Perf Report — selectState.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00021ms |
| p95 | 0.00029ms |
| p99 | 0.0017ms |
| mean | 0.00028ms |
| stdev | 0.00051ms |
| min | 0.00017ms |
| max | 0.0062ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p50 | 0.00021ms | 0.00025ms | -0.000042ms | -16.80% |
| p95 | 0.00029ms | 0.00025ms | +0.000042ms | +16.66% |
| p99 | 0.0017ms | 0.0012ms | +0.00057ms | +49.22% |
| mean | 0.00028ms | 0.00031ms | -0.000029ms | -9.38% |
| min | 0.00017ms | 0.00021ms | -0.000042ms | -20.19% |
| max | 0.0062ms | 0.0092ms | -0.0030ms | -32.89% |
| total | 0.06ms | 0.06ms | -0.0058ms | -9.38% |

