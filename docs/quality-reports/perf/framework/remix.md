# Perf Suite — remix

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeLoader | 0.0034ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeAction | 0.0027ms | 0.0041ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeLoader | 0.05ms | 10ms | PASS |
| invokeAction | 0.04ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeLoader | -49144 B | 0 B | 102400 B | yes | PASS |
| invokeAction | -9136 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeLoader

# Perf Report — invokeLoader.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0034ms |
| p50 | 0.0041ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0060ms |
| stdev | 0.0057ms |
| min | 0.0032ms |
| max | 0.05ms |
| total | 1.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0034ms | 0.0033ms | +0.000083ms | +2.52% |
| p50 | 0.0041ms | 0.0040ms | +0.00013ms | +3.13% |
| p95 | 0.01ms | 0.01ms | +0.0016ms | +13.08% |
| p99 | 0.03ms | 0.03ms | +0.00057ms | +1.87% |
| mean | 0.0060ms | 0.0054ms | +0.00059ms | +11.03% |
| min | 0.0032ms | 0.0031ms | +0.000041ms | +1.31% |
| max | 0.05ms | 0.05ms | +0.0037ms | +7.92% |
| total | 1.19ms | 1.08ms | +0.12ms | +11.03% |

### invokeAction

# Perf Report — invokeAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0028ms |
| p95 | 0.0041ms |
| p99 | 0.0098ms |
| mean | 0.0035ms |
| stdev | 0.0050ms |
| min | 0.0027ms |
| max | 0.07ms |
| total | 0.69ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0027ms | +0.000042ms | +1.55% |
| p50 | 0.0028ms | 0.0027ms | +0.000083ms | +3.02% |
| p95 | 0.0041ms | 0.0040ms | +0.000089ms | +2.21% |
| p99 | 0.0098ms | 0.0083ms | +0.0015ms | +17.60% |
| mean | 0.0035ms | 0.0030ms | +0.00046ms | +15.29% |
| min | 0.0027ms | 0.0026ms | +0.000083ms | +3.21% |
| max | 0.07ms | 0.01ms | +0.06ms | +395.58% |
| total | 0.69ms | 0.60ms | +0.09ms | +15.29% |

