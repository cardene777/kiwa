# Perf Suite — dogfood-ably-collab-cursor

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| joinBoard | 0.0039ms | 0.04ms | 50ms | 0.00042ms | PASS | regressed — gate 無効 (regressionGate=false) |
| moveCursor | 10.12ms | 12.63ms | 100ms | 0.00042ms | PASS | stable (p10 +1% (閾値未満)、 p95 +22% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| rewindHistory | 0.00092ms | 0.01ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| getPresence | 0.00062ms | 0.0045ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| joinBoard | 0.06ms | 100ms | PASS |
| moveCursor | 11.22ms | 200ms | PASS |
| rewindHistory | 0.01ms | 60ms | PASS |
| getPresence | 0.01ms | 60ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| joinBoard | 32640 B | 0 B | 102400 B | yes | PASS |
| moveCursor | 49008 B | 0 B | 102400 B | yes | PASS |
| rewindHistory | 24240 B | 0 B | 102400 B | yes | PASS |
| getPresence | 37072 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### joinBoard

# Perf Report — joinBoard.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0039ms |
| p50 | 0.0055ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.0099ms |
| stdev | 0.01ms |
| min | 0.0038ms |
| max | 0.05ms |
| total | 0.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0039ms | 0.0018ms | +0.0020ms | +111.88% |
| p50 | 0.0055ms | 0.0022ms | +0.0033ms | +151.00% |
| p95 | 0.04ms | 0.01ms | +0.03ms | +248.18% |
| p99 | 0.05ms | 0.02ms | +0.03ms | +142.40% |
| mean | 0.0099ms | 0.0038ms | +0.0061ms | +162.02% |
| min | 0.0038ms | 0.0018ms | +0.0020ms | +116.63% |
| max | 0.05ms | 0.02ms | +0.03ms | +123.84% |
| total | 0.40ms | 0.15ms | +0.25ms | +162.02% |

### moveCursor

# Perf Report — moveCursor.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 10.12ms |
| p50 | 10.61ms |
| p95 | 12.63ms |
| p99 | 15.17ms |
| mean | 10.85ms |
| stdev | 1.15ms |
| min | 9.36ms |
| max | 16.68ms |
| total | 434.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 10.12ms | 10.03ms | +0.09ms | +0.86% |
| p50 | 10.61ms | 10.31ms | +0.30ms | +2.93% |
| p95 | 12.63ms | 10.38ms | +2.25ms | +21.68% |
| p99 | 15.17ms | 10.41ms | +4.76ms | +45.69% |
| mean | 10.85ms | 10.19ms | +0.66ms | +6.53% |
| min | 9.36ms | 8.91ms | +0.45ms | +5.04% |
| max | 16.68ms | 10.43ms | +6.25ms | +59.93% |
| total | 434.05ms | 407.45ms | +26.60ms | +6.53% |

### rewindHistory

# Perf Report — rewindHistory.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00092ms |
| p50 | 0.0012ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0026ms |
| stdev | 0.0038ms |
| min | 0.00088ms |
| max | 0.02ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00092ms | 0.0011ms | -0.00017ms | -15.49% |
| p50 | 0.0012ms | 0.0011ms | +0.00010ms | +9.29% |
| p95 | 0.01ms | 0.0086ms | +0.0017ms | +19.20% |
| p99 | 0.02ms | 0.02ms | +0.00030ms | +1.73% |
| mean | 0.0026ms | 0.0024ms | +0.00021ms | +8.75% |
| min | 0.00088ms | 0.0011ms | -0.00021ms | -19.21% |
| max | 0.02ms | 0.02ms | -0.0025ms | -11.03% |
| total | 0.10ms | 0.09ms | +0.0083ms | +8.75% |

### getPresence

# Perf Report — getPresence.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00062ms |
| p50 | 0.00063ms |
| p95 | 0.0045ms |
| p99 | 0.01ms |
| mean | 0.0013ms |
| stdev | 0.0021ms |
| min | 0.00058ms |
| max | 0.01ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00062ms | 0.00054ms | +0.000079ms | +14.54% |
| p50 | 0.00063ms | 0.00058ms | +0.000041ms | +7.02% |
| p95 | 0.0045ms | 0.0043ms | +0.00024ms | +5.53% |
| p99 | 0.01ms | 0.0076ms | +0.0026ms | +34.05% |
| mean | 0.0013ms | 0.0011ms | +0.00021ms | +18.57% |
| min | 0.00058ms | 0.00054ms | +0.000042ms | +7.76% |
| max | 0.01ms | 0.0092ms | +0.0027ms | +29.55% |
| total | 0.05ms | 0.04ms | +0.0083ms | +18.57% |

