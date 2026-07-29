# Perf Suite — dogfood-ably-collab-cursor

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| joinBoard | 0.0017ms | 0.01ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| moveCursor | 9.79ms | 10.39ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| rewindHistory | 0.00096ms | 0.0075ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| getPresence | 0.00058ms | 0.0041ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| joinBoard | 0.03ms | 100ms | PASS |
| moveCursor | 10.53ms | 200ms | PASS |
| rewindHistory | 0.04ms | 60ms | PASS |
| getPresence | 0.01ms | 60ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| joinBoard | 26784 B | 0 B | 102400 B | yes | PASS |
| moveCursor | 50912 B | 0 B | 102400 B | yes | PASS |
| rewindHistory | 30312 B | 0 B | 102400 B | yes | PASS |
| getPresence | 36864 B | 0 B | 102400 B | yes | PASS |

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
| mean | 0.0038ms |
| stdev | 0.0045ms |
| min | 0.0017ms |
| max | 0.02ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0017ms | 0.0018ms | -0.00012ms | -6.56% |
| p50 | 0.0022ms | 0.0022ms | +5.0e-7ms | +0.02% |
| p95 | 0.01ms | 0.01ms | +0.0000059ms | +0.05% |
| p99 | 0.02ms | 0.02ms | +0.00037ms | +1.76% |
| mean | 0.0038ms | 0.0038ms | -0.000017ms | -0.44% |
| min | 0.0017ms | 0.0018ms | -0.000083ms | -4.74% |
| max | 0.02ms | 0.02ms | -0.0015ms | -6.17% |
| total | 0.15ms | 0.15ms | -0.00066ms | -0.44% |

### moveCursor

# Perf Report — moveCursor.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 9.79ms |
| p50 | 10.29ms |
| p95 | 10.39ms |
| p99 | 10.42ms |
| mean | 10.15ms |
| stdev | 0.35ms |
| min | 9.11ms |
| max | 10.44ms |
| total | 406.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 9.79ms | 10.03ms | -0.24ms | -2.36% |
| p50 | 10.29ms | 10.31ms | -0.01ms | -0.12% |
| p95 | 10.39ms | 10.38ms | +0.0073ms | +0.07% |
| p99 | 10.42ms | 10.41ms | +0.0085ms | +0.08% |
| mean | 10.15ms | 10.19ms | -0.03ms | -0.32% |
| min | 9.11ms | 8.91ms | +0.20ms | +2.26% |
| max | 10.44ms | 10.43ms | +0.0047ms | +0.04% |
| total | 406.14ms | 407.45ms | -1.31ms | -0.32% |

### rewindHistory

# Perf Report — rewindHistory.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00096ms |
| p50 | 0.0012ms |
| p95 | 0.0075ms |
| p99 | 0.01ms |
| mean | 0.0023ms |
| stdev | 0.0029ms |
| min | 0.00088ms |
| max | 0.02ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00096ms | 0.0011ms | -0.00013ms | -11.62% |
| p50 | 0.0012ms | 0.0011ms | +0.000042ms | +3.73% |
| p95 | 0.0075ms | 0.0086ms | -0.0012ms | -13.47% |
| p99 | 0.01ms | 0.02ms | -0.0039ms | -22.19% |
| mean | 0.0023ms | 0.0024ms | -0.000081ms | -3.44% |
| min | 0.00088ms | 0.0011ms | -0.00021ms | -19.21% |
| max | 0.02ms | 0.02ms | -0.0062ms | -27.85% |
| total | 0.09ms | 0.09ms | -0.0033ms | -3.44% |

### getPresence

# Perf Report — getPresence.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.00058ms |
| p95 | 0.0041ms |
| p99 | 0.0087ms |
| mean | 0.0012ms |
| stdev | 0.0018ms |
| min | 0.00054ms |
| max | 0.010ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00058ms | 0.00054ms | +0.000041ms | +7.56% |
| p50 | 0.00058ms | 0.00058ms | 0.00ms | 0.00% |
| p95 | 0.0041ms | 0.0043ms | -0.00015ms | -3.54% |
| p99 | 0.0087ms | 0.0076ms | +0.0011ms | +15.18% |
| mean | 0.0012ms | 0.0011ms | +0.000087ms | +7.79% |
| min | 0.00054ms | 0.00054ms | +0.0000010ms | +0.18% |
| max | 0.010ms | 0.0092ms | +0.00079ms | +8.64% |
| total | 0.05ms | 0.04ms | +0.0035ms | +7.79% |

