# Perf Suite — api

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| requestClientGet | 0.01ms | 0.04ms | 5ms | 0.00033ms | PASS | stable (p10 +12% (閾値未満)、 p95 +45% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| requestClientPost | 0.0062ms | 0.0090ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| requestClientGet | 0.17ms | 10ms | PASS |
| requestClientPost | 0.41ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| requestClientGet | 51992 B | -46959 B | 102400 B | yes | PASS |
| requestClientPost | -126200 B | -2530 B | 102400 B | yes | PASS |

## Detailed serial reports

### requestClientGet

# Perf Report — requestClientGet.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.11ms |
| mean | 0.02ms |
| stdev | 0.06ms |
| min | 0.0096ms |
| max | 0.79ms |
| total | 4.65ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0091ms | +0.0010ms | +11.51% |
| p50 | 0.02ms | 0.01ms | +0.0056ms | +54.71% |
| p95 | 0.04ms | 0.03ms | +0.01ms | +44.79% |
| p99 | 0.11ms | 0.07ms | +0.04ms | +64.53% |
| mean | 0.02ms | 0.01ms | +0.0092ms | +65.57% |
| min | 0.0096ms | 0.0087ms | +0.00092ms | +10.58% |
| max | 0.79ms | 0.10ms | +0.69ms | +701.52% |
| total | 4.65ms | 2.81ms | +1.84ms | +65.57% |

### requestClientPost

# Perf Report — requestClientPost.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0062ms |
| p50 | 0.0066ms |
| p95 | 0.0090ms |
| p99 | 0.02ms |
| mean | 0.0072ms |
| stdev | 0.0045ms |
| min | 0.0060ms |
| max | 0.07ms |
| total | 1.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0062ms | 0.0072ms | -0.0010ms | -14.46% |
| p50 | 0.0066ms | 0.0074ms | -0.00081ms | -11.02% |
| p95 | 0.0090ms | 0.0088ms | +0.00028ms | +3.16% |
| p99 | 0.02ms | 0.02ms | -0.0014ms | -7.12% |
| mean | 0.0072ms | 0.0078ms | -0.00058ms | -7.39% |
| min | 0.0060ms | 0.0071ms | -0.0011ms | -15.87% |
| max | 0.07ms | 0.03ms | +0.04ms | +157.99% |
| total | 1.44ms | 1.56ms | -0.12ms | -7.39% |

