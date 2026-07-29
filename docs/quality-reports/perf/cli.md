# Perf Suite — cli

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| runSpecToTest | 0.08ms | 0.13ms | 20ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| runSpecToTest | 0.45ms | 40ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| runSpecToTest | 3760 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### runSpecToTest

# Perf Report — runSpecToTest.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.08ms |
| p50 | 0.09ms |
| p95 | 0.13ms |
| p99 | 0.21ms |
| mean | 0.10ms |
| stdev | 0.03ms |
| min | 0.07ms |
| max | 0.27ms |
| total | 9.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.08ms | 0.09ms | -0.01ms | -12.97% |
| p50 | 0.09ms | 0.11ms | -0.02ms | -16.38% |
| p95 | 0.13ms | 0.24ms | -0.11ms | -44.92% |
| p99 | 0.21ms | 4.86ms | -4.65ms | -95.78% |
| mean | 0.10ms | 0.23ms | -0.13ms | -58.18% |
| min | 0.07ms | 0.09ms | -0.01ms | -12.25% |
| max | 0.27ms | 6.15ms | -5.88ms | -95.57% |
| total | 9.61ms | 22.99ms | -13.37ms | -58.18% |

