# Perf Suite — dogfood-ably-collab-cursor

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| joinBoard | 0.0025ms | 0.07ms | 50ms | 0.00032ms | PASS | regressed — gate 無効 (regressionGate=false) |
| moveCursor | 10.77ms | 12.00ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| rewindHistory | 0.00079ms | 0.01ms | 30ms | 0.00033ms | PASS | stable (p10 +4% (閾値未満)、 p95 +23% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| getPresence | 0.00050ms | 0.0045ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| joinBoard | cpu | 0.08ms | 0.0025ms | 0.030 | 0.018 | 0.0024ms | 0.0015ms |
| moveCursor | cpu | 0.08ms | 10.77ms | 130.177 | 124.252 | 10.69ms | 10.20ms |
| rewindHistory | cpu | 0.08ms | 0.00079ms | 0.010 | 0.009 | 0.00078ms | 0.00075ms |
| getPresence | cpu | 0.08ms | 0.00050ms | 0.006 | 0.006 | 0.00050ms | 0.00050ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| joinBoard | 0.07ms | 100ms | PASS |
| moveCursor | 11.62ms | 200ms | PASS |
| rewindHistory | 0.01ms | 60ms | PASS |
| getPresence | 0.01ms | 60ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| joinBoard | 50016 B | 0 B | 102400 B | yes | PASS |
| moveCursor | 49264 B | 0 B | 102400 B | yes | PASS |
| rewindHistory | 38816 B | 0 B | 102400 B | yes | PASS |
| getPresence | 38688 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### joinBoard

# Perf Report — joinBoard.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0025ms |
| p50 | 0.0066ms |
| p95 | 0.07ms |
| p99 | 0.10ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.0016ms |
| max | 0.10ms |
| total | 0.73ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0025ms | 0.0015ms | +0.0010ms | +69.66% |
| p50 | 0.0066ms | 0.0021ms | +0.0046ms | +219.06% |
| p95 | 0.07ms | 0.01ms | +0.06ms | +552.70% |
| p99 | 0.10ms | 0.05ms | +0.05ms | +104.54% |
| mean | 0.02ms | 0.0050ms | +0.01ms | +269.94% |
| min | 0.0016ms | 0.0014ms | +0.00021ms | +15.20% |
| max | 0.10ms | 0.06ms | +0.04ms | +74.76% |
| total | 0.73ms | 0.20ms | +0.54ms | +269.94% |

### moveCursor

# Perf Report — moveCursor.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 10.77ms |
| p50 | 11.42ms |
| p95 | 12.00ms |
| p99 | 14.31ms |
| mean | 11.36ms |
| stdev | 0.84ms |
| min | 9.44ms |
| max | 15.57ms |
| total | 454.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 10.77ms | 10.20ms | +0.57ms | +5.59% |
| p50 | 11.42ms | 10.29ms | +1.13ms | +11.03% |
| p95 | 12.00ms | 10.39ms | +1.61ms | +15.51% |
| p99 | 14.31ms | 10.42ms | +3.89ms | +37.31% |
| mean | 11.36ms | 10.27ms | +1.09ms | +10.57% |
| min | 9.44ms | 9.89ms | -0.44ms | -4.47% |
| max | 15.57ms | 10.43ms | +5.14ms | +49.24% |
| total | 454.28ms | 410.85ms | +43.43ms | +10.57% |

### rewindHistory

# Perf Report — rewindHistory.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00079ms |
| p50 | 0.00092ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0024ms |
| stdev | 0.0041ms |
| min | 0.00079ms |
| max | 0.02ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00079ms | 0.00075ms | +0.000042ms | +5.60% |
| p50 | 0.00092ms | 0.00083ms | +0.000083ms | +9.95% |
| p95 | 0.01ms | 0.0089ms | +0.0022ms | +25.10% |
| p99 | 0.02ms | 0.02ms | +0.00043ms | +2.39% |
| mean | 0.0024ms | 0.0022ms | +0.00020ms | +8.99% |
| min | 0.00079ms | 0.00071ms | +0.000082ms | +11.57% |
| max | 0.02ms | 0.02ms | +0.00033ms | +1.49% |
| total | 0.10ms | 0.09ms | +0.0079ms | +8.99% |

### getPresence

# Perf Report — getPresence.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00058ms |
| p95 | 0.0045ms |
| p99 | 0.01ms |
| mean | 0.0014ms |
| stdev | 0.0026ms |
| min | 0.00050ms |
| max | 0.01ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00050ms | +0.0000041ms | +0.83% |
| p50 | 0.00058ms | 0.00056ms | +0.000022ms | +3.82% |
| p95 | 0.0045ms | 0.01ms | -0.0056ms | -55.09% |
| p99 | 0.01ms | 0.01ms | +0.00028ms | +2.28% |
| mean | 0.0014ms | 0.0016ms | -0.00012ms | -7.43% |
| min | 0.00050ms | 0.00046ms | +0.000042ms | +9.17% |
| max | 0.01ms | 0.01ms | -0.00029ms | -2.20% |
| total | 0.06ms | 0.06ms | -0.0046ms | -7.43% |

