# Perf Suite — remix

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeLoader | 0.0032ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeAction | 0.0027ms | 0.0042ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeLoader | 0.05ms | 10ms | PASS |
| invokeAction | 0.06ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeLoader | -49192 B | 0 B | 102400 B | yes | PASS |
| invokeAction | 4880 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeLoader

# Perf Report — invokeLoader.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0032ms |
| p50 | 0.0037ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0053ms |
| stdev | 0.0062ms |
| min | 0.0030ms |
| max | 0.06ms |
| total | 1.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0032ms | 0.0033ms | -0.00012ms | -3.80% |
| p50 | 0.0037ms | 0.0040ms | -0.00025ms | -6.25% |
| p95 | 0.01ms | 0.01ms | -0.00066ms | -5.41% |
| p99 | 0.03ms | 0.03ms | +0.00020ms | +0.64% |
| mean | 0.0053ms | 0.0054ms | -0.000031ms | -0.58% |
| min | 0.0030ms | 0.0031ms | -0.000084ms | -2.69% |
| max | 0.06ms | 0.05ms | +0.01ms | +28.65% |
| total | 1.07ms | 1.08ms | -0.0063ms | -0.58% |

### invokeAction

# Perf Report — invokeAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0028ms |
| p95 | 0.0042ms |
| p99 | 0.010ms |
| mean | 0.0031ms |
| stdev | 0.0011ms |
| min | 0.0027ms |
| max | 0.01ms |
| total | 0.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0027ms | +0.000042ms | +1.55% |
| p50 | 0.0028ms | 0.0027ms | +0.000084ms | +3.04% |
| p95 | 0.0042ms | 0.0040ms | +0.00017ms | +4.18% |
| p99 | 0.010ms | 0.0083ms | +0.0017ms | +20.01% |
| mean | 0.0031ms | 0.0030ms | +0.00011ms | +3.67% |
| min | 0.0027ms | 0.0026ms | +0.00013ms | +4.84% |
| max | 0.01ms | 0.01ms | -0.0030ms | -21.11% |
| total | 0.62ms | 0.60ms | +0.02ms | +3.67% |

