# Perf Suite — dogfood-ably-collab-cursor

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| joinBoard | 0.0017ms | 0.0099ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| moveCursor | 9.84ms | 10.42ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| rewindHistory | 0.0010ms | 0.0086ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| getPresence | 0.00054ms | 0.0042ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| joinBoard | 0.03ms | 100ms | PASS |
| moveCursor | 10.53ms | 200ms | PASS |
| rewindHistory | 0.01ms | 60ms | PASS |
| getPresence | 0.01ms | 60ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| joinBoard | 31952 B | 0 B | 102400 B | yes | PASS |
| moveCursor | 44248 B | 0 B | 102400 B | yes | PASS |
| rewindHistory | 30304 B | 0 B | 102400 B | yes | PASS |
| getPresence | 36864 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### joinBoard

# Perf Report — joinBoard.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0017ms |
| p50 | 0.0020ms |
| p95 | 0.0099ms |
| p99 | 0.02ms |
| mean | 0.0035ms |
| stdev | 0.0040ms |
| min | 0.0016ms |
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0017ms | 0.0018ms | -0.00012ms | -6.56% |
| p50 | 0.0020ms | 0.0022ms | -0.00017ms | -7.52% |
| p95 | 0.0099ms | 0.01ms | -0.0021ms | -17.44% |
| p99 | 0.02ms | 0.02ms | -0.0021ms | -9.95% |
| mean | 0.0035ms | 0.0038ms | -0.00031ms | -8.06% |
| min | 0.0016ms | 0.0018ms | -0.00013ms | -7.14% |
| max | 0.02ms | 0.02ms | -0.0029ms | -12.01% |
| total | 0.14ms | 0.15ms | -0.01ms | -8.06% |

### moveCursor

# Perf Report — moveCursor.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 9.84ms |
| p50 | 10.33ms |
| p95 | 10.42ms |
| p99 | 10.48ms |
| mean | 10.19ms |
| stdev | 0.31ms |
| min | 9.22ms |
| max | 10.49ms |
| total | 407.80ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 9.84ms | 10.03ms | -0.19ms | -1.85% |
| p50 | 10.33ms | 10.31ms | +0.03ms | +0.26% |
| p95 | 10.42ms | 10.38ms | +0.04ms | +0.41% |
| p99 | 10.48ms | 10.41ms | +0.07ms | +0.66% |
| mean | 10.19ms | 10.19ms | +0.0087ms | +0.09% |
| min | 9.22ms | 8.91ms | +0.31ms | +3.52% |
| max | 10.49ms | 10.43ms | +0.06ms | +0.56% |
| total | 407.80ms | 407.45ms | +0.35ms | +0.09% |

### rewindHistory

# Perf Report — rewindHistory.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0011ms |
| p95 | 0.0086ms |
| p99 | 0.01ms |
| mean | 0.0022ms |
| stdev | 0.0029ms |
| min | 0.00088ms |
| max | 0.02ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0010ms | 0.0011ms | -0.000042ms | -3.87% |
| p50 | 0.0011ms | 0.0011ms | +0.000020ms | +1.82% |
| p95 | 0.0086ms | 0.0086ms | -0.000066ms | -0.76% |
| p99 | 0.01ms | 0.02ms | -0.0043ms | -24.55% |
| mean | 0.0022ms | 0.0024ms | -0.00013ms | -5.67% |
| min | 0.00088ms | 0.0011ms | -0.00021ms | -19.21% |
| max | 0.02ms | 0.02ms | -0.0062ms | -28.03% |
| total | 0.09ms | 0.09ms | -0.0054ms | -5.67% |

### getPresence

# Perf Report — getPresence.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00058ms |
| p95 | 0.0042ms |
| p99 | 0.0088ms |
| mean | 0.0012ms |
| stdev | 0.0019ms |
| min | 0.00054ms |
| max | 0.01ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00054ms | 0.00ms | 0.00% |
| p50 | 0.00058ms | 0.00058ms | -0.0000010ms | -0.17% |
| p95 | 0.0042ms | 0.0043ms | -0.00011ms | -2.64% |
| p99 | 0.0088ms | 0.0076ms | +0.0013ms | +16.52% |
| mean | 0.0012ms | 0.0011ms | +0.000064ms | +5.75% |
| min | 0.00054ms | 0.00054ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.0092ms | +0.00096ms | +10.46% |
| total | 0.05ms | 0.04ms | +0.0026ms | +5.75% |

