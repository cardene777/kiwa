# Perf Suite — sveltekit

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeLoad | 0.00067ms | 0.0017ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeAction | 0.01ms | 0.03ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeLoad | 0.02ms | 10ms | PASS |
| invokeAction | 0.15ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeLoad | -16688 B | 0 B | 102400 B | yes | PASS |
| invokeAction | -538248 B | -14402 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeLoad

# Perf Report — invokeLoad.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00067ms |
| p50 | 0.00083ms |
| p95 | 0.0017ms |
| p99 | 0.0093ms |
| mean | 0.0010ms |
| stdev | 0.0012ms |
| min | 0.00067ms |
| max | 0.01ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00067ms | 0.00067ms | 0.00ms | 0.00% |
| p50 | 0.00083ms | 0.00071ms | +0.00012ms | +17.49% |
| p95 | 0.0017ms | 0.0015ms | +0.00018ms | +12.10% |
| p99 | 0.0093ms | 0.0073ms | +0.0019ms | +26.50% |
| mean | 0.0010ms | 0.00098ms | +0.000062ms | +6.34% |
| min | 0.00067ms | 0.00063ms | +0.000041ms | +6.56% |
| max | 0.01ms | 0.0098ms | +0.00075ms | +7.66% |
| total | 0.21ms | 0.20ms | +0.01ms | +6.34% |

### invokeAction

# Perf Report — invokeAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.08ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.22ms |
| total | 3.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00012ms | +1.16% |
| p50 | 0.01ms | 0.01ms | +0.00033ms | +2.91% |
| p95 | 0.03ms | 0.03ms | +0.0042ms | +15.04% |
| p99 | 0.08ms | 0.11ms | -0.03ms | -27.89% |
| mean | 0.02ms | 0.02ms | +0.00096ms | +6.15% |
| min | 0.01ms | 0.01ms | +0.000042ms | +0.41% |
| max | 0.22ms | 0.13ms | +0.09ms | +71.65% |
| total | 3.31ms | 3.12ms | +0.19ms | +6.15% |

