# Perf Suite — state

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| createStore | 0.00029ms | 0.00077ms | 5ms | 0.00033ms | PASS | stable (p10 -13% (閾値未満)、 p95 +68% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
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
| createStore | -5400 B | 0 B | 102400 B | yes | PASS |
| dispatch | -15136 B | 0 B | 102400 B | yes | PASS |
| selectState | 257328 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### createStore

# Perf Report — createStore.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00077ms |
| p99 | 0.0045ms |
| mean | 0.00045ms |
| stdev | 0.00062ms |
| min | 0.00025ms |
| max | 0.0049ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| p50 | 0.00033ms | 0.00033ms | -0.0000010ms | -0.30% |
| p95 | 0.00077ms | 0.00046ms | +0.00031ms | +67.83% |
| p99 | 0.0045ms | 0.0029ms | +0.0016ms | +54.28% |
| mean | 0.00045ms | 0.00044ms | +0.000013ms | +2.85% |
| min | 0.00025ms | 0.00029ms | -0.000041ms | -14.09% |
| max | 0.0049ms | 0.0059ms | -0.0010ms | -16.90% |
| total | 0.09ms | 0.09ms | +0.0025ms | +2.85% |

### dispatch

# Perf Report — dispatch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00046ms |
| p95 | 0.00071ms |
| p99 | 0.0045ms |
| mean | 0.00057ms |
| stdev | 0.00099ms |
| min | 0.00029ms |
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00058ms | -0.00029ms | -49.91% |
| p50 | 0.00046ms | 0.00058ms | -0.00013ms | -21.58% |
| p95 | 0.00071ms | 0.00071ms | +9.5e-7ms | +0.13% |
| p99 | 0.0045ms | 0.0044ms | +0.000075ms | +1.71% |
| mean | 0.00057ms | 0.00075ms | -0.00018ms | -23.56% |
| min | 0.00029ms | 0.00054ms | -0.00025ms | -46.21% |
| max | 0.01ms | 0.01ms | +0.00054ms | +4.74% |
| total | 0.11ms | 0.15ms | -0.04ms | -23.56% |

### selectState

# Perf Report — selectState.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00021ms |
| p95 | 0.00029ms |
| p99 | 0.0022ms |
| mean | 0.00034ms |
| stdev | 0.0011ms |
| min | 0.00021ms |
| max | 0.02ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p50 | 0.00021ms | 0.00025ms | -0.000041ms | -16.40% |
| p95 | 0.00029ms | 0.00025ms | +0.000040ms | +15.83% |
| p99 | 0.0022ms | 0.0012ms | +0.0010ms | +88.30% |
| mean | 0.00034ms | 0.00031ms | +0.000032ms | +10.31% |
| min | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.0092ms | +0.0065ms | +69.83% |
| total | 0.07ms | 0.06ms | +0.0064ms | +10.31% |

