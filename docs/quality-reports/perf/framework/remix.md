# Perf Suite — remix

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeLoader | 0.0033ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeAction | 0.0027ms | 0.0045ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeLoader | 0.05ms | 10ms | PASS |
| invokeAction | 0.05ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeLoader | -49160 B | 0 B | 102400 B | yes | PASS |
| invokeAction | -4480 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeLoader

# Perf Report — invokeLoader.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0033ms |
| p50 | 0.0039ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0052ms |
| stdev | 0.0047ms |
| min | 0.0030ms |
| max | 0.04ms |
| total | 1.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0033ms | 0.0033ms | -1.0e-7ms | -0.00% |
| p50 | 0.0039ms | 0.0040ms | -0.000083ms | -2.07% |
| p95 | 0.01ms | 0.01ms | +0.000082ms | +0.67% |
| p99 | 0.03ms | 0.03ms | -0.00021ms | -0.68% |
| mean | 0.0052ms | 0.0054ms | -0.00022ms | -4.14% |
| min | 0.0030ms | 0.0031ms | -0.00013ms | -4.00% |
| max | 0.04ms | 0.05ms | -0.0024ms | -5.16% |
| total | 1.03ms | 1.08ms | -0.04ms | -4.14% |

### invokeAction

# Perf Report — invokeAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0028ms |
| p95 | 0.0045ms |
| p99 | 0.0083ms |
| mean | 0.0031ms |
| stdev | 0.0010ms |
| min | 0.0026ms |
| max | 0.01ms |
| total | 0.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0027ms | 0.00ms | 0.00% |
| p50 | 0.0028ms | 0.0027ms | +0.000042ms | +1.53% |
| p95 | 0.0045ms | 0.0040ms | +0.00046ms | +11.43% |
| p99 | 0.0083ms | 0.0083ms | -0.000044ms | -0.52% |
| mean | 0.0031ms | 0.0030ms | +0.000088ms | +2.94% |
| min | 0.0026ms | 0.0026ms | +0.0000010ms | +0.04% |
| max | 0.01ms | 0.01ms | -0.0042ms | -29.62% |
| total | 0.62ms | 0.60ms | +0.02ms | +2.94% |

