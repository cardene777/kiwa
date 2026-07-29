# Perf Suite — expo

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| createExpoTestEnv | 0.00083ms | 0.0023ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| routerPushCycle | 0.00050ms | 0.0010ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| notificationDispatch | 0.00050ms | 0.0013ms | 5ms | 0.00033ms | PASS | stable (p10 +9% (閾値未満)、 p95 +43% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createExpoTestEnv | 0.03ms | 10ms | PASS |
| routerPushCycle | 0.01ms | 10ms | PASS |
| notificationDispatch | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| createExpoTestEnv | -9784 B | 0 B | 102400 B | yes | PASS |
| routerPushCycle | -12768 B | 0 B | 102400 B | yes | PASS |
| notificationDispatch | -128 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### createExpoTestEnv

# Perf Report — createExpoTestEnv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00083ms |
| p50 | 0.00092ms |
| p95 | 0.0023ms |
| p99 | 0.0087ms |
| mean | 0.0015ms |
| stdev | 0.0021ms |
| min | 0.00079ms |
| max | 0.02ms |
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00083ms | 0.00083ms | 0.00ms | 0.00% |
| p50 | 0.00092ms | 0.00098ms | -0.000062ms | -6.33% |
| p95 | 0.0023ms | 0.0039ms | -0.0016ms | -40.48% |
| p99 | 0.0087ms | 0.0079ms | +0.00085ms | +10.77% |
| mean | 0.0015ms | 0.0017ms | -0.00028ms | -16.26% |
| min | 0.00079ms | 0.00079ms | +0.0000010ms | +0.13% |
| max | 0.02ms | 0.02ms | +0.00088ms | +3.80% |
| total | 0.29ms | 0.35ms | -0.06ms | -16.26% |

### routerPushCycle

# Perf Report — routerPushCycle.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.0010ms |
| p99 | 0.0058ms |
| mean | 0.00068ms |
| stdev | 0.00077ms |
| min | 0.00050ms |
| max | 0.0070ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p50 | 0.00054ms | 0.00054ms | +0.0000010ms | +0.18% |
| p95 | 0.0010ms | 0.0011ms | -0.000079ms | -7.21% |
| p99 | 0.0058ms | 0.0047ms | +0.0011ms | +23.66% |
| mean | 0.00068ms | 0.00067ms | +0.0000061ms | +0.91% |
| min | 0.00050ms | 0.00046ms | +0.000042ms | +9.17% |
| max | 0.0070ms | 0.0062ms | +0.00075ms | +12.10% |
| total | 0.14ms | 0.13ms | +0.0012ms | +0.91% |

### notificationDispatch

# Perf Report — notificationDispatch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.0013ms |
| p99 | 0.0064ms |
| mean | 0.00076ms |
| stdev | 0.0014ms |
| min | 0.00050ms |
| max | 0.02ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00046ms | +0.000042ms | +9.17% |
| p50 | 0.00054ms | 0.00050ms | +0.000042ms | +8.40% |
| p95 | 0.0013ms | 0.00088ms | +0.00038ms | +42.76% |
| p99 | 0.0064ms | 0.0028ms | +0.0036ms | +126.19% |
| mean | 0.00076ms | 0.00063ms | +0.00013ms | +20.90% |
| min | 0.00050ms | 0.00046ms | +0.000042ms | +9.17% |
| max | 0.02ms | 0.0092ms | +0.0090ms | +97.27% |
| total | 0.15ms | 0.13ms | +0.03ms | +20.90% |

