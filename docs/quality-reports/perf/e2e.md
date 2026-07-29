# Perf Suite — e2e

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| fetchOverLoopback | 0.16ms | 0.47ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| fetchOverLoopback | 1.21ms | 40ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| fetchOverLoopback | 215592 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### fetchOverLoopback

# Perf Report — fetchOverLoopback.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.16ms |
| p50 | 0.20ms |
| p95 | 0.47ms |
| p99 | 0.62ms |
| mean | 0.24ms |
| stdev | 0.12ms |
| min | 0.15ms |
| max | 0.90ms |
| total | 23.80ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.16ms | 0.14ms | +0.02ms | +11.74% |
| p50 | 0.20ms | 0.17ms | +0.03ms | +15.21% |
| p95 | 0.47ms | 0.49ms | -0.02ms | -3.38% |
| p99 | 0.62ms | 0.66ms | -0.04ms | -6.01% |
| mean | 0.24ms | 0.22ms | +0.02ms | +8.09% |
| min | 0.15ms | 0.13ms | +0.02ms | +13.80% |
| max | 0.90ms | 0.70ms | +0.20ms | +28.16% |
| total | 23.80ms | 22.02ms | +1.78ms | +8.09% |

