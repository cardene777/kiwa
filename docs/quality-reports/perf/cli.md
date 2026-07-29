# Perf Suite — cli

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限はこの 2 倍 = 0.00033ms。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | gate | regression |
|---|---|---|---|---|---|
| runSpecToTest | 0.08ms | 0.14ms | 20ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| runSpecToTest | 0.59ms | 40ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| runSpecToTest | 9304 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### runSpecToTest

# Perf Report — runSpecToTest.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.08ms |
| p50 | 0.09ms |
| p95 | 0.14ms |
| p99 | 0.18ms |
| mean | 0.10ms |
| stdev | 0.02ms |
| min | 0.07ms |
| max | 0.19ms |
| total | 9.56ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.08ms | 0.09ms | -0.01ms | -16.21% |
| p50 | 0.09ms | 0.11ms | -0.02ms | -17.90% |
| p95 | 0.14ms | 0.24ms | -0.10ms | -40.74% |
| p99 | 0.18ms | 4.86ms | -4.68ms | -96.30% |
| mean | 0.10ms | 0.23ms | -0.13ms | -58.41% |
| min | 0.07ms | 0.09ms | -0.01ms | -12.25% |
| max | 0.19ms | 6.15ms | -5.96ms | -96.87% |
| total | 9.56ms | 22.99ms | -13.43ms | -58.41% |

