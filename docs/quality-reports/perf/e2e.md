# Perf Suite — e2e

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| fetchOverLoopback | 0.16ms | 0.49ms | 20ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| fetchOverLoopback | 0.97ms | 40ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| fetchOverLoopback | 216320 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### fetchOverLoopback

# Perf Report — fetchOverLoopback.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.16ms |
| p50 | 0.19ms |
| p95 | 0.49ms |
| p99 | 0.64ms |
| mean | 0.24ms |
| stdev | 0.13ms |
| min | 0.14ms |
| max | 0.71ms |
| total | 24.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.16ms | 0.14ms | +0.01ms | +8.08% |
| p50 | 0.19ms | 0.17ms | +0.02ms | +9.92% |
| p95 | 0.49ms | 0.49ms | +0.0063ms | +1.29% |
| p99 | 0.64ms | 0.66ms | -0.01ms | -1.58% |
| mean | 0.24ms | 0.22ms | +0.02ms | +9.54% |
| min | 0.14ms | 0.13ms | +0.01ms | +7.75% |
| max | 0.71ms | 0.70ms | +0.0055ms | +0.79% |
| total | 24.12ms | 22.02ms | +2.10ms | +9.54% |

