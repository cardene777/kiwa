# Perf Suite — cli

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| runSpecToTest | 0.08ms | 0.26ms | 20ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| runSpecToTest | 1.23ms | 40ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| runSpecToTest | 2952 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### runSpecToTest

# Perf Report — runSpecToTest.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.08ms |
| p50 | 0.10ms |
| p95 | 0.26ms |
| p99 | 0.48ms |
| mean | 0.14ms |
| stdev | 0.18ms |
| min | 0.08ms |
| max | 1.84ms |
| total | 13.92ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.08ms | 0.09ms | -0.0083ms | -9.12% |
| p50 | 0.10ms | 0.11ms | -0.0045ms | -4.22% |
| p95 | 0.26ms | 0.24ms | +0.02ms | +9.41% |
| p99 | 0.48ms | 4.86ms | -4.38ms | -90.21% |
| mean | 0.14ms | 0.23ms | -0.09ms | -39.43% |
| min | 0.08ms | 0.09ms | -0.0079ms | -9.26% |
| max | 1.84ms | 6.15ms | -4.31ms | -70.03% |
| total | 13.92ms | 22.99ms | -9.06ms | -39.43% |

