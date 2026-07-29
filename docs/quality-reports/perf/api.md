# Perf Suite — api

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00042ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00083ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| requestClientGet | 0.0096ms | 0.03ms | 5ms | 0.00083ms | PASS | stable — gate 無効 (regressionGate=false) |
| requestClientPost | 0.0054ms | 0.0068ms | 5ms | 0.00083ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| requestClientGet | 0.21ms | 10ms | PASS |
| requestClientPost | 0.28ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| requestClientGet | 35688 B | -45292 B | 102400 B | yes | PASS |
| requestClientPost | -131080 B | -1980 B | 102400 B | yes | PASS |

## Detailed serial reports

### requestClientGet

# Perf Report — requestClientGet.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0096ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.06ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.0090ms |
| max | 0.10ms |
| total | 3.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0096ms | 0.0091ms | +0.00055ms | +6.00% |
| p50 | 0.01ms | 0.01ms | +0.0019ms | +18.86% |
| p95 | 0.03ms | 0.03ms | +0.0015ms | +4.91% |
| p99 | 0.06ms | 0.07ms | -0.01ms | -16.00% |
| mean | 0.02ms | 0.01ms | +0.0013ms | +9.35% |
| min | 0.0090ms | 0.0087ms | +0.00038ms | +4.34% |
| max | 0.10ms | 0.10ms | +0.0025ms | +2.48% |
| total | 3.07ms | 2.81ms | +0.26ms | +9.35% |

### requestClientPost

# Perf Report — requestClientPost.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0054ms |
| p50 | 0.0056ms |
| p95 | 0.0068ms |
| p99 | 0.01ms |
| mean | 0.0059ms |
| stdev | 0.0013ms |
| min | 0.0052ms |
| max | 0.02ms |
| total | 1.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0054ms | 0.0072ms | -0.0018ms | -24.92% |
| p50 | 0.0056ms | 0.0074ms | -0.0017ms | -23.73% |
| p95 | 0.0068ms | 0.0088ms | -0.0019ms | -22.05% |
| p99 | 0.01ms | 0.02ms | -0.0050ms | -25.40% |
| mean | 0.0059ms | 0.0078ms | -0.0019ms | -23.95% |
| min | 0.0052ms | 0.0071ms | -0.0019ms | -26.47% |
| max | 0.02ms | 0.03ms | -0.01ms | -40.53% |
| total | 1.18ms | 1.56ms | -0.37ms | -23.95% |

