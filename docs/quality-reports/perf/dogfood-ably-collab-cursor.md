# Perf Suite — dogfood-ably-collab-cursor

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| joinBoard | 0.0017ms | 0.01ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| moveCursor | 10.37ms | 11.58ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| rewindHistory | 0.00083ms | 0.0076ms | 30ms | 0.00033ms | PASS | stable (差 0.00025ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| getPresence | 0.00054ms | 0.0051ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| joinBoard | 0.03ms | 100ms | PASS |
| moveCursor | 11.79ms | 200ms | PASS |
| rewindHistory | 0.01ms | 60ms | PASS |
| getPresence | 0.01ms | 60ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| joinBoard | -111592 B | 0 B | 102400 B | yes | PASS |
| moveCursor | 49328 B | 0 B | 102400 B | yes | PASS |
| rewindHistory | 29912 B | 0 B | 102400 B | yes | PASS |
| getPresence | 46848 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### joinBoard

# Perf Report — joinBoard.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0017ms |
| p50 | 0.0022ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0041ms |
| stdev | 0.0054ms |
| min | 0.0016ms |
| max | 0.03ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0017ms | 0.0018ms | -0.00012ms | -6.61% |
| p50 | 0.0022ms | 0.0022ms | +5.0e-7ms | +0.02% |
| p95 | 0.01ms | 0.01ms | +0.00019ms | +1.56% |
| p99 | 0.02ms | 0.02ms | +0.0038ms | +18.35% |
| mean | 0.0041ms | 0.0038ms | +0.00026ms | +6.95% |
| min | 0.0016ms | 0.0018ms | -0.00013ms | -7.14% |
| max | 0.03ms | 0.02ms | +0.00087ms | +3.60% |
| total | 0.16ms | 0.15ms | +0.01ms | +6.95% |

### moveCursor

# Perf Report — moveCursor.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 10.37ms |
| p50 | 11.10ms |
| p95 | 11.58ms |
| p99 | 11.61ms |
| mean | 11.07ms |
| stdev | 0.50ms |
| min | 9.65ms |
| max | 11.62ms |
| total | 442.71ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 10.37ms | 10.03ms | +0.34ms | +3.41% |
| p50 | 11.10ms | 10.31ms | +0.79ms | +7.68% |
| p95 | 11.58ms | 10.38ms | +1.20ms | +11.55% |
| p99 | 11.61ms | 10.41ms | +1.20ms | +11.50% |
| mean | 11.07ms | 10.19ms | +0.88ms | +8.65% |
| min | 9.65ms | 8.91ms | +0.74ms | +8.33% |
| max | 11.62ms | 10.43ms | +1.18ms | +11.35% |
| total | 442.71ms | 407.45ms | +35.26ms | +8.65% |

### rewindHistory

# Perf Report — rewindHistory.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00083ms |
| p50 | 0.0013ms |
| p95 | 0.0076ms |
| p99 | 0.01ms |
| mean | 0.0021ms |
| stdev | 0.0025ms |
| min | 0.00083ms |
| max | 0.01ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00083ms | 0.0011ms | -0.00025ms | -23.15% |
| p50 | 0.0013ms | 0.0011ms | +0.00017ms | +14.80% |
| p95 | 0.0076ms | 0.0086ms | -0.0011ms | -12.39% |
| p99 | 0.01ms | 0.02ms | -0.0059ms | -33.44% |
| mean | 0.0021ms | 0.0024ms | -0.00025ms | -10.38% |
| min | 0.00083ms | 0.0011ms | -0.00025ms | -23.08% |
| max | 0.01ms | 0.02ms | -0.0086ms | -38.69% |
| total | 0.08ms | 0.09ms | -0.0098ms | -10.38% |

### getPresence

# Perf Report — getPresence.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00058ms |
| p95 | 0.0051ms |
| p99 | 0.0095ms |
| mean | 0.0013ms |
| stdev | 0.0020ms |
| min | 0.00054ms |
| max | 0.01ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00054ms | 0.00ms | 0.00% |
| p50 | 0.00058ms | 0.00058ms | -0.0000010ms | -0.17% |
| p95 | 0.0051ms | 0.0043ms | +0.00081ms | +18.85% |
| p99 | 0.0095ms | 0.0076ms | +0.0019ms | +25.70% |
| mean | 0.0013ms | 0.0011ms | +0.00015ms | +13.46% |
| min | 0.00054ms | 0.00054ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.0092ms | +0.0015ms | +15.92% |
| total | 0.05ms | 0.04ms | +0.0060ms | +13.46% |

