# Perf Suite — cli

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| runSpecToTest | 0.08ms | 0.11ms | 20ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| runSpecToTest | 0.45ms | 40ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| runSpecToTest | 4152 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### runSpecToTest

# Perf Report — runSpecToTest.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.08ms |
| p50 | 0.09ms |
| p95 | 0.11ms |
| p99 | 0.21ms |
| mean | 0.09ms |
| stdev | 0.02ms |
| min | 0.08ms |
| max | 0.22ms |
| total | 9.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.08ms | 0.09ms | -0.01ms | -12.08% |
| p50 | 0.09ms | 0.11ms | -0.02ms | -18.05% |
| p95 | 0.11ms | 0.24ms | -0.12ms | -52.22% |
| p99 | 0.21ms | 4.86ms | -4.65ms | -95.69% |
| mean | 0.09ms | 0.23ms | -0.14ms | -59.28% |
| min | 0.08ms | 0.09ms | -0.0076ms | -8.92% |
| max | 0.22ms | 6.15ms | -5.93ms | -96.43% |
| total | 9.36ms | 22.99ms | -13.63ms | -59.28% |

