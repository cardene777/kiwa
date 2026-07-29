# Perf Suite — api

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| requestClientGet | 0.0090ms | 0.03ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| requestClientPost | 0.0071ms | 0.02ms | 5ms | 0.00033ms | PASS | stable (p10 -2% (閾値未満)、 p95 +76% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| requestClientGet | 0.12ms | 10ms | PASS |
| requestClientPost | 0.11ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| requestClientGet | -6336 B | 0 B | 102400 B | yes | PASS |
| requestClientPost | 1104 B | 0 B | 102400 B | yes | PASS |

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
| p99 | 0.09ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0085ms |
| max | 0.10ms |
| total | 2.85ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0090ms | 0.0091ms | -0.000038ms | -0.42% |
| p50 | 0.01ms | 0.01ms | -0.000021ms | -0.21% |
| p95 | 0.03ms | 0.03ms | +0.0020ms | +6.64% |
| p99 | 0.09ms | 0.07ms | +0.02ms | +28.03% |
| mean | 0.01ms | 0.01ms | +0.00018ms | +1.32% |
| min | 0.0085ms | 0.0087ms | -0.00021ms | -2.40% |
| max | 0.10ms | 0.10ms | +0.00067ms | +0.67% |
| total | 2.85ms | 2.81ms | +0.04ms | +1.32% |

### requestClientPost

# Perf Report — requestClientPost.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0071ms |
| p50 | 0.0075ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0087ms |
| stdev | 0.0054ms |
| min | 0.0069ms |
| max | 0.07ms |
| total | 1.73ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0071ms | 0.0072ms | -0.00012ms | -1.72% |
| p50 | 0.0075ms | 0.0074ms | +0.000083ms | +1.13% |
| p95 | 0.02ms | 0.0088ms | +0.0067ms | +75.96% |
| p99 | 0.03ms | 0.02ms | +0.01ms | +66.54% |
| mean | 0.0087ms | 0.0078ms | +0.00088ms | +11.30% |
| min | 0.0069ms | 0.0071ms | -0.00021ms | -2.94% |
| max | 0.07ms | 0.03ms | +0.04ms | +160.13% |
| total | 1.73ms | 1.56ms | +0.18ms | +11.30% |

