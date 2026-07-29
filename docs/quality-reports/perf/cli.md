# Perf Suite — cli

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| runSpecToTest | 0.10ms | 0.24ms | 20ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| runSpecToTest | 0.59ms | 40ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| runSpecToTest | 3528 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### runSpecToTest

# Perf Report — runSpecToTest.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.10ms |
| p50 | 0.11ms |
| p95 | 0.24ms |
| p99 | 0.72ms |
| mean | 0.15ms |
| stdev | 0.24ms |
| min | 0.09ms |
| max | 2.46ms |
| total | 15.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.10ms | 0.09ms | +0.0087ms | +9.59% |
| p50 | 0.11ms | 0.11ms | +0.0077ms | +7.22% |
| p95 | 0.24ms | 0.24ms | +0.0036ms | +1.52% |
| p99 | 0.72ms | 4.86ms | -4.13ms | -85.11% |
| mean | 0.15ms | 0.23ms | -0.08ms | -33.08% |
| min | 0.09ms | 0.09ms | +0.0071ms | +8.38% |
| max | 2.46ms | 6.15ms | -3.69ms | -59.96% |
| total | 15.38ms | 22.99ms | -7.60ms | -33.08% |

