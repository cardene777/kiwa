# Perf Suite — dogfood-socketio-notification

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| subscribeRoom | 3.44ms | 3.51ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| deliverNotification | 3.13ms | 3.49ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| getPending | 0.00033ms | 0.0029ms | 30ms | 0.00033ms | PASS | stable (p10 -2% (閾値未満)、 p95 +30% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| simulateReconnect | 0.00042ms | 0.0033ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| subscribeRoom | 3.61ms | 100ms | PASS |
| deliverNotification | 3.52ms | 60ms | PASS |
| getPending | 0.00ms | 60ms | PASS |
| simulateReconnect | 0.00ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| subscribeRoom | 91704 B | 0 B | 102400 B | yes | PASS |
| deliverNotification | 38744 B | 0 B | 102400 B | yes | PASS |
| getPending | 32928 B | 0 B | 102400 B | yes | PASS |
| simulateReconnect | 45488 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### subscribeRoom

# Perf Report — subscribeRoom.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.44ms |
| p50 | 3.46ms |
| p95 | 3.51ms |
| p99 | 3.53ms |
| mean | 3.40ms |
| stdev | 0.26ms |
| min | 2.32ms |
| max | 3.53ms |
| total | 136.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.44ms | 3.35ms | +0.10ms | +2.84% |
| p50 | 3.46ms | 3.45ms | +0.02ms | +0.53% |
| p95 | 3.51ms | 3.52ms | -0.02ms | -0.46% |
| p99 | 3.53ms | 3.63ms | -0.10ms | -2.72% |
| mean | 3.40ms | 3.42ms | -0.01ms | -0.38% |
| min | 2.32ms | 2.36ms | -0.05ms | -2.05% |
| max | 3.53ms | 3.68ms | -0.16ms | -4.30% |
| total | 136.16ms | 136.68ms | -0.52ms | -0.38% |

### deliverNotification

# Perf Report — deliverNotification.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.13ms |
| p50 | 3.44ms |
| p95 | 3.49ms |
| p99 | 3.53ms |
| mean | 3.33ms |
| stdev | 0.30ms |
| min | 2.29ms |
| max | 3.56ms |
| total | 133.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.13ms | 3.18ms | -0.06ms | -1.84% |
| p50 | 3.44ms | 3.45ms | -0.0096ms | -0.28% |
| p95 | 3.49ms | 3.53ms | -0.04ms | -1.27% |
| p99 | 3.53ms | 3.77ms | -0.24ms | -6.40% |
| mean | 3.33ms | 3.35ms | -0.02ms | -0.48% |
| min | 2.29ms | 2.29ms | +0.0021ms | +0.09% |
| max | 3.56ms | 3.87ms | -0.31ms | -8.07% |
| total | 133.17ms | 133.81ms | -0.64ms | -0.48% |

### getPending

# Perf Report — getPending.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00033ms |
| p95 | 0.0029ms |
| p99 | 0.0085ms |
| mean | 0.00095ms |
| stdev | 0.0018ms |
| min | 0.00029ms |
| max | 0.01ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | -0.0000051ms | -1.53% |
| p50 | 0.00033ms | 0.00038ms | -0.000041ms | -11.07% |
| p95 | 0.0029ms | 0.0023ms | +0.00067ms | +29.61% |
| p99 | 0.0085ms | 0.0050ms | +0.0035ms | +70.92% |
| mean | 0.00095ms | 0.00076ms | +0.00019ms | +24.79% |
| min | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| max | 0.01ms | 0.0064ms | +0.0043ms | +66.67% |
| total | 0.04ms | 0.03ms | +0.0075ms | +24.79% |

### simulateReconnect

# Perf Report — simulateReconnect.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00042ms |
| p95 | 0.0033ms |
| p99 | 0.0060ms |
| mean | 0.00089ms |
| stdev | 0.0013ms |
| min | 0.00042ms |
| max | 0.0061ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00046ms | -0.000042ms | -9.17% |
| p50 | 0.00042ms | 0.00050ms | -0.000083ms | -16.60% |
| p95 | 0.0033ms | 0.0031ms | +0.00020ms | +6.52% |
| p99 | 0.0060ms | 0.0062ms | -0.00015ms | -2.44% |
| mean | 0.00089ms | 0.00093ms | -0.000036ms | -3.92% |
| min | 0.00042ms | 0.00046ms | -0.000042ms | -9.17% |
| max | 0.0061ms | 0.0070ms | -0.00083ms | -11.97% |
| total | 0.04ms | 0.04ms | -0.0015ms | -3.92% |

