# Perf Suite — e2e

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| fetchOverLoopback | 0.15ms | 0.43ms | 20ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| fetchOverLoopback | 1.11ms | 40ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| fetchOverLoopback | 215936 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### fetchOverLoopback

# Perf Report — fetchOverLoopback.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.15ms |
| p50 | 0.19ms |
| p95 | 0.43ms |
| p99 | 0.67ms |
| mean | 0.23ms |
| stdev | 0.11ms |
| min | 0.14ms |
| max | 0.82ms |
| total | 22.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.15ms | 0.14ms | +0.0093ms | +6.45% |
| p50 | 0.19ms | 0.17ms | +0.02ms | +10.90% |
| p95 | 0.43ms | 0.49ms | -0.05ms | -11.03% |
| p99 | 0.67ms | 0.66ms | +0.01ms | +1.79% |
| mean | 0.23ms | 0.22ms | +0.0062ms | +2.82% |
| min | 0.14ms | 0.13ms | +0.0063ms | +4.87% |
| max | 0.82ms | 0.70ms | +0.12ms | +17.03% |
| total | 22.64ms | 22.02ms | +0.62ms | +2.82% |

