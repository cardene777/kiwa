# Perf Suite — cli

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| runSpecToTest | 0.08ms | 0.22ms | 20ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| runSpecToTest | 0.83ms | 40ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| runSpecToTest | 3896 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### runSpecToTest

# Perf Report — runSpecToTest.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.08ms |
| p50 | 0.09ms |
| p95 | 0.22ms |
| p99 | 0.31ms |
| mean | 0.10ms |
| stdev | 0.05ms |
| min | 0.08ms |
| max | 0.31ms |
| total | 10.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.08ms | 0.09ms | -0.01ms | -11.79% |
| p50 | 0.09ms | 0.11ms | -0.02ms | -14.16% |
| p95 | 0.22ms | 0.24ms | -0.02ms | -7.69% |
| p99 | 0.31ms | 4.86ms | -4.55ms | -93.71% |
| mean | 0.10ms | 0.23ms | -0.13ms | -54.77% |
| min | 0.08ms | 0.09ms | -0.0078ms | -9.21% |
| max | 0.31ms | 6.15ms | -5.84ms | -94.93% |
| total | 10.40ms | 22.99ms | -12.59ms | -54.77% |

