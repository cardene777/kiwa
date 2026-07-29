# Perf Suite — cli

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| runSpecToTest | 0.07ms | 0.12ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| runSpecToTest | 0.40ms | 40ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| runSpecToTest | 6160 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### runSpecToTest

# Perf Report — runSpecToTest.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.07ms |
| p50 | 0.08ms |
| p95 | 0.12ms |
| p99 | 0.18ms |
| mean | 0.09ms |
| stdev | 0.02ms |
| min | 0.07ms |
| max | 0.19ms |
| total | 8.80ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.07ms | 0.09ms | -0.02ms | -18.05% |
| p50 | 0.08ms | 0.11ms | -0.02ms | -22.55% |
| p95 | 0.12ms | 0.24ms | -0.12ms | -49.07% |
| p99 | 0.18ms | 4.86ms | -4.68ms | -96.31% |
| mean | 0.09ms | 0.23ms | -0.14ms | -61.70% |
| min | 0.07ms | 0.09ms | -0.01ms | -14.26% |
| max | 0.19ms | 6.15ms | -5.96ms | -96.88% |
| total | 8.80ms | 22.99ms | -14.18ms | -61.70% |

