# Perf Suite — state

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| createStore | 0.00025ms | 0.0017ms | 5ms | 0.00033ms | PASS | stable (差 0.000083ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| dispatch | 0.00033ms | 0.00071ms | 5ms | 0.00033ms | PASS | stable (差 0.00025ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
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
| createStore | -7688 B | 0 B | 102400 B | yes | PASS |
| dispatch | -15136 B | 0 B | 102400 B | yes | PASS |
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
| p95 | 0.0017ms |
| p99 | 0.0044ms |
| mean | 0.00057ms |
| stdev | 0.00086ms |
| min | 0.00025ms |
| max | 0.0072ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00033ms | -0.000083ms | -24.92% |
| p50 | 0.00033ms | 0.00033ms | -0.0000010ms | -0.30% |
| p95 | 0.0017ms | 0.00046ms | +0.0012ms | +263.73% |
| p99 | 0.0044ms | 0.0029ms | +0.0016ms | +53.74% |
| mean | 0.00057ms | 0.00044ms | +0.00013ms | +30.63% |
| min | 0.00025ms | 0.00029ms | -0.000041ms | -14.09% |
| max | 0.0072ms | 0.0059ms | +0.0012ms | +21.13% |
| total | 0.11ms | 0.09ms | +0.03ms | +30.63% |

### dispatch

# Perf Report — dispatch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00046ms |
| p95 | 0.00071ms |
| p99 | 0.0040ms |
| mean | 0.00059ms |
| stdev | 0.00099ms |
| min | 0.00029ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00058ms | -0.00025ms | -42.88% |
| p50 | 0.00046ms | 0.00058ms | -0.00013ms | -21.58% |
| p95 | 0.00071ms | 0.00071ms | -0.0000020ms | -0.29% |
| p99 | 0.0040ms | 0.0044ms | -0.00042ms | -9.54% |
| mean | 0.00059ms | 0.00075ms | -0.00016ms | -21.02% |
| min | 0.00029ms | 0.00054ms | -0.00025ms | -46.03% |
| max | 0.01ms | 0.01ms | +0.00075ms | +6.57% |
| total | 0.12ms | 0.15ms | -0.03ms | -21.02% |

### selectState

# Perf Report — selectState.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00021ms |
| p95 | 0.00025ms |
| p99 | 0.0022ms |
| mean | 0.00034ms |
| stdev | 0.0011ms |
| min | 0.00017ms |
| max | 0.02ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p50 | 0.00021ms | 0.00025ms | -0.000041ms | -16.40% |
| p95 | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| p99 | 0.0022ms | 0.0012ms | +0.0010ms | +87.79% |
| mean | 0.00034ms | 0.00031ms | +0.000027ms | +8.57% |
| min | 0.00017ms | 0.00021ms | -0.000041ms | -19.71% |
| max | 0.02ms | 0.0092ms | +0.0067ms | +72.08% |
| total | 0.07ms | 0.06ms | +0.0053ms | +8.57% |

