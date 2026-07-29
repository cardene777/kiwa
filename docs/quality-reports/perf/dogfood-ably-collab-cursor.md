# Perf Suite — dogfood-ably-collab-cursor

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| joinBoard | 0.0017ms | 0.01ms | 50ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| moveCursor | 9.71ms | 24.59ms | 100ms | 0.00042ms | PASS | stable (p10 -3% (閾値未満)、 p95 +137% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| rewindHistory | 0.00083ms | 0.0078ms | 30ms | 0.00042ms | PASS | stable (差 0.00025ms が下限 0.00042ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| getPresence | 0.00054ms | 0.0045ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| joinBoard | 0.03ms | 100ms | PASS |
| moveCursor | 11.10ms | 200ms | PASS |
| rewindHistory | 0.01ms | 60ms | PASS |
| getPresence | 0.01ms | 60ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| joinBoard | 46880 B | 0 B | 102400 B | yes | PASS |
| moveCursor | 50896 B | 0 B | 102400 B | yes | PASS |
| rewindHistory | 31776 B | 0 B | 102400 B | yes | PASS |
| getPresence | 36624 B | 0 B | 102400 B | yes | PASS |

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
| mean | 0.0039ms |
| stdev | 0.0050ms |
| min | 0.0017ms |
| max | 0.02ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0017ms | 0.0018ms | -0.00012ms | -6.83% |
| p50 | 0.0022ms | 0.0022ms | 0.00ms | 0.00% |
| p95 | 0.01ms | 0.01ms | -0.00014ms | -1.13% |
| p99 | 0.02ms | 0.02ms | +0.0022ms | +10.69% |
| mean | 0.0039ms | 0.0038ms | +0.00010ms | +2.64% |
| min | 0.0017ms | 0.0018ms | -0.000084ms | -4.80% |
| max | 0.02ms | 0.02ms | -0.00067ms | -2.75% |
| total | 0.16ms | 0.15ms | +0.0040ms | +2.64% |

### moveCursor

# Perf Report — moveCursor.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 9.71ms |
| p50 | 10.72ms |
| p95 | 24.59ms |
| p99 | 36.88ms |
| mean | 13.29ms |
| stdev | 6.49ms |
| min | 9.49ms |
| max | 39.35ms |
| total | 531.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 9.71ms | 10.03ms | -0.32ms | -3.21% |
| p50 | 10.72ms | 10.31ms | +0.42ms | +4.06% |
| p95 | 24.59ms | 10.38ms | +14.22ms | +136.98% |
| p99 | 36.88ms | 10.41ms | +26.47ms | +254.21% |
| mean | 13.29ms | 10.19ms | +3.10ms | +30.46% |
| min | 9.49ms | 8.91ms | +0.58ms | +6.49% |
| max | 39.35ms | 10.43ms | +28.92ms | +277.25% |
| total | 531.54ms | 407.45ms | +124.09ms | +30.46% |

### rewindHistory

# Perf Report — rewindHistory.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00083ms |
| p50 | 0.0011ms |
| p95 | 0.0078ms |
| p99 | 0.01ms |
| mean | 0.0022ms |
| stdev | 0.0028ms |
| min | 0.00083ms |
| max | 0.01ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00083ms | 0.0011ms | -0.00025ms | -23.15% |
| p50 | 0.0011ms | 0.0011ms | 0.00ms | 0.00% |
| p95 | 0.0078ms | 0.0086ms | -0.00082ms | -9.47% |
| p99 | 0.01ms | 0.02ms | -0.0043ms | -24.63% |
| mean | 0.0022ms | 0.0024ms | -0.00018ms | -7.78% |
| min | 0.00083ms | 0.0011ms | -0.00025ms | -23.08% |
| max | 0.01ms | 0.02ms | -0.0078ms | -34.95% |
| total | 0.09ms | 0.09ms | -0.0074ms | -7.78% |

### getPresence

# Perf Report — getPresence.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00058ms |
| p95 | 0.0045ms |
| p99 | 0.0092ms |
| mean | 0.0012ms |
| stdev | 0.0019ms |
| min | 0.00054ms |
| max | 0.01ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00054ms | 0.00ms | 0.00% |
| p50 | 0.00058ms | 0.00058ms | 0.00ms | 0.00% |
| p95 | 0.0045ms | 0.0043ms | +0.00017ms | +4.04% |
| p99 | 0.0092ms | 0.0076ms | +0.0016ms | +21.46% |
| mean | 0.0012ms | 0.0011ms | +0.00011ms | +10.14% |
| min | 0.00054ms | 0.00054ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.0092ms | +0.00096ms | +10.46% |
| total | 0.05ms | 0.04ms | +0.0045ms | +10.14% |

