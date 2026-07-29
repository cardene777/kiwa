# Perf Suite — e2e

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| fetchOverLoopback | 0.14ms | 0.45ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| fetchOverLoopback | 1.31ms | 40ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| fetchOverLoopback | 216368 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### fetchOverLoopback

# Perf Report — fetchOverLoopback.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.14ms |
| p50 | 0.18ms |
| p95 | 0.45ms |
| p99 | 0.59ms |
| mean | 0.22ms |
| stdev | 0.11ms |
| min | 0.13ms |
| max | 0.70ms |
| total | 21.68ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.14ms | 0.14ms | -0.00097ms | -0.67% |
| p50 | 0.18ms | 0.17ms | +0.0099ms | +5.82% |
| p95 | 0.45ms | 0.49ms | -0.04ms | -7.81% |
| p99 | 0.59ms | 0.66ms | -0.07ms | -10.55% |
| mean | 0.22ms | 0.22ms | -0.0034ms | -1.55% |
| min | 0.13ms | 0.13ms | +0.0029ms | +2.24% |
| max | 0.70ms | 0.70ms | -0.0045ms | -0.64% |
| total | 21.68ms | 22.02ms | -0.34ms | -1.55% |

