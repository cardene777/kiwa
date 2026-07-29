# Perf Suite — remix

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeLoader | 0.0034ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeAction | 0.0032ms | 0.0048ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeLoader | 0.23ms | 10ms | PASS |
| invokeAction | 0.10ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeLoader | -45320 B | 0 B | 102400 B | yes | PASS |
| invokeAction | 7344 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeLoader

# Perf Report — invokeLoader.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0034ms |
| p50 | 0.0036ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.08ms |
| min | 0.0034ms |
| max | 1.17ms |
| total | 2.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0034ms | 0.0033ms | +0.00013ms | +3.80% |
| p50 | 0.0036ms | 0.0040ms | -0.00037ms | -9.37% |
| p95 | 0.01ms | 0.01ms | -0.00011ms | -0.87% |
| p99 | 0.03ms | 0.03ms | +0.0032ms | +10.40% |
| mean | 0.01ms | 0.0054ms | +0.0060ms | +111.10% |
| min | 0.0034ms | 0.0031ms | +0.00025ms | +8.00% |
| max | 1.17ms | 0.05ms | +1.13ms | +2408.02% |
| total | 2.27ms | 1.08ms | +1.20ms | +111.10% |

### invokeAction

# Perf Report — invokeAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0032ms |
| p50 | 0.0033ms |
| p95 | 0.0048ms |
| p99 | 0.01ms |
| mean | 0.0037ms |
| stdev | 0.0015ms |
| min | 0.0031ms |
| max | 0.02ms |
| total | 0.73ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0032ms | 0.0027ms | +0.00050ms | +18.46% |
| p50 | 0.0033ms | 0.0027ms | +0.00056ms | +20.45% |
| p95 | 0.0048ms | 0.0040ms | +0.00075ms | +18.54% |
| p99 | 0.01ms | 0.0083ms | +0.0028ms | +34.25% |
| mean | 0.0037ms | 0.0030ms | +0.00067ms | +22.31% |
| min | 0.0031ms | 0.0026ms | +0.00054ms | +20.98% |
| max | 0.02ms | 0.01ms | +0.0021ms | +14.66% |
| total | 0.73ms | 0.60ms | +0.13ms | +22.31% |

