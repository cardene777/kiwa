# Perf Suite — dogfood-ably-collab-cursor

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| joinBoard | 0.0017ms | 0.0092ms | 50ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| moveCursor | 10.04ms | 10.44ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| rewindHistory | 0.0011ms | 0.0078ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| getPresence | 0.00054ms | 0.0063ms | 30ms | 0.00042ms | PASS | stable (p10 -0% (閾値未満)、 p95 +48% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| joinBoard | 0.03ms | 100ms | PASS |
| moveCursor | 10.70ms | 200ms | PASS |
| rewindHistory | 0.01ms | 60ms | PASS |
| getPresence | 0.01ms | 60ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| joinBoard | 31528 B | 0 B | 102400 B | yes | PASS |
| moveCursor | 49360 B | 0 B | 102400 B | yes | PASS |
| rewindHistory | 30616 B | 0 B | 102400 B | yes | PASS |
| getPresence | 37880 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### joinBoard

# Perf Report — joinBoard.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0017ms |
| p50 | 0.0021ms |
| p95 | 0.0092ms |
| p99 | 0.02ms |
| mean | 0.0036ms |
| stdev | 0.0042ms |
| min | 0.0017ms |
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0017ms | 0.0018ms | -0.00012ms | -6.61% |
| p50 | 0.0021ms | 0.0022ms | -0.000083ms | -3.76% |
| p95 | 0.0092ms | 0.01ms | -0.0028ms | -23.24% |
| p99 | 0.02ms | 0.02ms | -0.00062ms | -2.97% |
| mean | 0.0036ms | 0.0038ms | -0.00021ms | -5.61% |
| min | 0.0017ms | 0.0018ms | -0.000084ms | -4.80% |
| max | 0.02ms | 0.02ms | -0.0012ms | -4.98% |
| total | 0.14ms | 0.15ms | -0.0085ms | -5.61% |

### moveCursor

# Perf Report — moveCursor.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 10.04ms |
| p50 | 10.36ms |
| p95 | 10.44ms |
| p99 | 10.48ms |
| mean | 10.29ms |
| stdev | 0.16ms |
| min | 9.80ms |
| max | 10.50ms |
| total | 411.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 10.04ms | 10.03ms | +0.01ms | +0.11% |
| p50 | 10.36ms | 10.31ms | +0.05ms | +0.51% |
| p95 | 10.44ms | 10.38ms | +0.06ms | +0.57% |
| p99 | 10.48ms | 10.41ms | +0.07ms | +0.67% |
| mean | 10.29ms | 10.19ms | +0.10ms | +0.99% |
| min | 9.80ms | 8.91ms | +0.89ms | +9.96% |
| max | 10.50ms | 10.43ms | +0.07ms | +0.66% |
| total | 411.47ms | 407.45ms | +4.02ms | +0.99% |

### rewindHistory

# Perf Report — rewindHistory.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0011ms |
| p50 | 0.0011ms |
| p95 | 0.0078ms |
| p99 | 0.01ms |
| mean | 0.0021ms |
| stdev | 0.0025ms |
| min | 0.0010ms |
| max | 0.01ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0011ms | 0.0011ms | -9.0e-7ms | -0.08% |
| p50 | 0.0011ms | 0.0011ms | 0.00ms | 0.00% |
| p95 | 0.0078ms | 0.0086ms | -0.00079ms | -9.14% |
| p99 | 0.01ms | 0.02ms | -0.0060ms | -34.41% |
| mean | 0.0021ms | 0.0024ms | -0.00030ms | -12.71% |
| min | 0.0010ms | 0.0011ms | -0.000041ms | -3.79% |
| max | 0.01ms | 0.02ms | -0.0090ms | -40.19% |
| total | 0.08ms | 0.09ms | -0.01ms | -12.71% |

### getPresence

# Perf Report — getPresence.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00058ms |
| p95 | 0.0063ms |
| p99 | 0.0098ms |
| mean | 0.0014ms |
| stdev | 0.0022ms |
| min | 0.00054ms |
| max | 0.010ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00054ms | -0.0000010ms | -0.18% |
| p50 | 0.00058ms | 0.00058ms | -0.0000010ms | -0.17% |
| p95 | 0.0063ms | 0.0043ms | +0.0020ms | +47.68% |
| p99 | 0.0098ms | 0.0076ms | +0.0022ms | +29.55% |
| mean | 0.0014ms | 0.0011ms | +0.00027ms | +23.96% |
| min | 0.00054ms | 0.00054ms | 0.00ms | 0.00% |
| max | 0.010ms | 0.0092ms | +0.00079ms | +8.64% |
| total | 0.06ms | 0.04ms | +0.01ms | +23.96% |

