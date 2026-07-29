# Perf Suite — cli

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| runSpecToTest | 0.08ms | 0.24ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| runSpecToTest | 1.56ms | 40ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| runSpecToTest | 5208 B | -5499 B | 102400 B | yes | PASS |

## Detailed serial reports

### runSpecToTest

# Perf Report — runSpecToTest.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.08ms |
| p50 | 0.09ms |
| p95 | 0.24ms |
| p99 | 0.82ms |
| mean | 0.13ms |
| stdev | 0.19ms |
| min | 0.08ms |
| max | 1.77ms |
| total | 13.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.08ms | 0.09ms | -0.0084ms | -9.22% |
| p50 | 0.09ms | 0.11ms | -0.01ms | -13.05% |
| p95 | 0.24ms | 0.24ms | -0.00047ms | -0.20% |
| p99 | 0.82ms | 4.86ms | -4.04ms | -83.08% |
| mean | 0.13ms | 0.23ms | -0.10ms | -42.23% |
| min | 0.08ms | 0.09ms | -0.0065ms | -7.60% |
| max | 1.77ms | 6.15ms | -4.38ms | -71.26% |
| total | 13.28ms | 22.99ms | -9.71ms | -42.23% |

