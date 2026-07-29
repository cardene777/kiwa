# Perf Suite — api

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| requestClientGet | 0.0090ms | 0.03ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| requestClientPost | 0.0068ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| requestClientGet | 0.17ms | 10ms | PASS |
| requestClientPost | 0.08ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| requestClientGet | 13272 B | 0 B | 102400 B | yes | PASS |
| requestClientPost | 1664 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### requestClientGet

# Perf Report — requestClientGet.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0090ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.05ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0087ms |
| max | 0.10ms |
| total | 2.77ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0090ms | 0.0091ms | -0.000038ms | -0.42% |
| p50 | 0.01ms | 0.01ms | -0.000084ms | -0.82% |
| p95 | 0.03ms | 0.03ms | -0.000093ms | -0.31% |
| p99 | 0.05ms | 0.07ms | -0.01ms | -19.82% |
| mean | 0.01ms | 0.01ms | -0.00017ms | -1.22% |
| min | 0.0087ms | 0.0087ms | +0.000042ms | +0.48% |
| max | 0.10ms | 0.10ms | -0.00017ms | -0.17% |
| total | 2.77ms | 2.81ms | -0.03ms | -1.22% |

### requestClientPost

# Perf Report — requestClientPost.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0068ms |
| p50 | 0.0070ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0075ms |
| stdev | 0.0015ms |
| min | 0.0067ms |
| max | 0.02ms |
| total | 1.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0068ms | 0.0072ms | -0.00037ms | -5.19% |
| p50 | 0.0070ms | 0.0074ms | -0.00033ms | -4.52% |
| p95 | 0.01ms | 0.0088ms | +0.0014ms | +16.44% |
| p99 | 0.02ms | 0.02ms | -0.0047ms | -23.69% |
| mean | 0.0075ms | 0.0078ms | -0.00031ms | -4.03% |
| min | 0.0067ms | 0.0071ms | -0.00033ms | -4.70% |
| max | 0.02ms | 0.03ms | -0.0092ms | -36.41% |
| total | 1.49ms | 1.56ms | -0.06ms | -4.03% |

