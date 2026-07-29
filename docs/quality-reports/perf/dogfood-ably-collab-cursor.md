# Perf Suite — dogfood-ably-collab-cursor

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| joinBoard | 0.0017ms | 0.03ms | 50ms | 0.00033ms | PASS | stable (p10 -5% (閾値未満)、 p95 +177% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| moveCursor | 9.68ms | 12.92ms | 100ms | 0.00033ms | PASS | stable (p10 -4% (閾値未満)、 p95 +25% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| rewindHistory | 0.0012ms | 0.0082ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| getPresence | 0.00063ms | 0.0048ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| joinBoard | 0.03ms | 100ms | PASS |
| moveCursor | 11.43ms | 200ms | PASS |
| rewindHistory | 0.02ms | 60ms | PASS |
| getPresence | 0.01ms | 60ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| joinBoard | 38592 B | 0 B | 102400 B | yes | PASS |
| moveCursor | 50896 B | 0 B | 102400 B | yes | PASS |
| rewindHistory | 23784 B | 0 B | 102400 B | yes | PASS |
| getPresence | 46960 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### joinBoard

# Perf Report — joinBoard.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0017ms |
| p50 | 0.0057ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.0087ms |
| stdev | 0.01ms |
| min | 0.0017ms |
| max | 0.04ms |
| total | 0.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0017ms | 0.0018ms | -0.000083ms | -4.54% |
| p50 | 0.0057ms | 0.0022ms | +0.0035ms | +156.66% |
| p95 | 0.03ms | 0.01ms | +0.02ms | +177.47% |
| p99 | 0.04ms | 0.02ms | +0.02ms | +109.29% |
| mean | 0.0087ms | 0.0038ms | +0.0049ms | +129.21% |
| min | 0.0017ms | 0.0018ms | -0.000083ms | -4.74% |
| max | 0.04ms | 0.02ms | +0.02ms | +85.07% |
| total | 0.35ms | 0.15ms | +0.20ms | +129.21% |

### moveCursor

# Perf Report — moveCursor.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 9.68ms |
| p50 | 10.52ms |
| p95 | 12.92ms |
| p99 | 13.50ms |
| mean | 10.81ms |
| stdev | 0.97ms |
| min | 9.35ms |
| max | 13.86ms |
| total | 432.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 9.68ms | 10.03ms | -0.35ms | -3.52% |
| p50 | 10.52ms | 10.31ms | +0.22ms | +2.13% |
| p95 | 12.92ms | 10.38ms | +2.55ms | +24.54% |
| p99 | 13.50ms | 10.41ms | +3.08ms | +29.62% |
| mean | 10.81ms | 10.19ms | +0.62ms | +6.11% |
| min | 9.35ms | 8.91ms | +0.44ms | +4.97% |
| max | 13.86ms | 10.43ms | +3.43ms | +32.88% |
| total | 432.36ms | 407.45ms | +24.91ms | +6.11% |

### rewindHistory

# Perf Report — rewindHistory.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0012ms |
| p50 | 0.0013ms |
| p95 | 0.0082ms |
| p99 | 0.010ms |
| mean | 0.0021ms |
| stdev | 0.0022ms |
| min | 0.0012ms |
| max | 0.01ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0012ms | 0.0011ms | +0.000083ms | +7.67% |
| p50 | 0.0013ms | 0.0011ms | +0.00013ms | +11.11% |
| p95 | 0.0082ms | 0.0086ms | -0.00041ms | -4.77% |
| p99 | 0.010ms | 0.02ms | -0.0076ms | -43.17% |
| mean | 0.0021ms | 0.0024ms | -0.00023ms | -9.50% |
| min | 0.0012ms | 0.0011ms | +0.000083ms | +7.66% |
| max | 0.01ms | 0.02ms | -0.01ms | -52.71% |
| total | 0.09ms | 0.09ms | -0.0090ms | -9.50% |

### getPresence

# Perf Report — getPresence.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00063ms |
| p50 | 0.00069ms |
| p95 | 0.0048ms |
| p99 | 0.0099ms |
| mean | 0.0014ms |
| stdev | 0.0021ms |
| min | 0.00058ms |
| max | 0.01ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00063ms | 0.00054ms | +0.000083ms | +15.31% |
| p50 | 0.00069ms | 0.00058ms | +0.00010ms | +17.72% |
| p95 | 0.0048ms | 0.0043ms | +0.00049ms | +11.50% |
| p99 | 0.0099ms | 0.0076ms | +0.0023ms | +30.62% |
| mean | 0.0014ms | 0.0011ms | +0.00026ms | +22.96% |
| min | 0.00058ms | 0.00054ms | +0.000042ms | +7.76% |
| max | 0.01ms | 0.0092ms | +0.0020ms | +22.29% |
| total | 0.06ms | 0.04ms | +0.01ms | +22.96% |

