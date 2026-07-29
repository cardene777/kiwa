# Perf Suite — dogfood-socketio-notification

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| subscribeRoom | 3.29ms | 3.57ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| deliverNotification | 3.18ms | 3.48ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| getPending | 0.00029ms | 0.0025ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| simulateReconnect | 0.00042ms | 0.0037ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| subscribeRoom | 3.78ms | 100ms | PASS |
| deliverNotification | 3.58ms | 60ms | PASS |
| getPending | 0.01ms | 60ms | PASS |
| simulateReconnect | 0.00ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| subscribeRoom | 90840 B | 0 B | 102400 B | yes | PASS |
| deliverNotification | 40024 B | 0 B | 102400 B | yes | PASS |
| getPending | 28592 B | 0 B | 102400 B | yes | PASS |
| simulateReconnect | 46944 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### subscribeRoom

# Perf Report — subscribeRoom.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.29ms |
| p50 | 3.48ms |
| p95 | 3.57ms |
| p99 | 3.64ms |
| mean | 3.43ms |
| stdev | 0.21ms |
| min | 2.33ms |
| max | 3.67ms |
| total | 137.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.29ms | 3.35ms | -0.05ms | -1.51% |
| p50 | 3.48ms | 3.45ms | +0.03ms | +0.91% |
| p95 | 3.57ms | 3.52ms | +0.05ms | +1.43% |
| p99 | 3.64ms | 3.63ms | +0.02ms | +0.45% |
| mean | 3.43ms | 3.42ms | +0.01ms | +0.38% |
| min | 2.33ms | 2.36ms | -0.03ms | -1.42% |
| max | 3.67ms | 3.68ms | -0.02ms | -0.49% |
| total | 137.19ms | 136.68ms | +0.52ms | +0.38% |

### deliverNotification

# Perf Report — deliverNotification.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.18ms |
| p50 | 3.44ms |
| p95 | 3.48ms |
| p99 | 3.50ms |
| mean | 3.41ms |
| stdev | 0.10ms |
| min | 3.10ms |
| max | 3.51ms |
| total | 136.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.18ms | 3.18ms | -0.0064ms | -0.20% |
| p50 | 3.44ms | 3.45ms | -0.0031ms | -0.09% |
| p95 | 3.48ms | 3.53ms | -0.05ms | -1.52% |
| p99 | 3.50ms | 3.77ms | -0.27ms | -7.28% |
| mean | 3.41ms | 3.35ms | +0.07ms | +2.06% |
| min | 3.10ms | 2.29ms | +0.81ms | +35.22% |
| max | 3.51ms | 3.87ms | -0.36ms | -9.38% |
| total | 136.57ms | 133.81ms | +2.76ms | +2.06% |

### getPending

# Perf Report — getPending.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.0025ms |
| p99 | 0.01ms |
| mean | 0.00099ms |
| stdev | 0.0024ms |
| min | 0.00029ms |
| max | 0.01ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00033ms | -0.000042ms | -12.57% |
| p50 | 0.00033ms | 0.00038ms | -0.000041ms | -10.93% |
| p95 | 0.0025ms | 0.0023ms | +0.00018ms | +7.89% |
| p99 | 0.01ms | 0.0050ms | +0.0061ms | +123.90% |
| mean | 0.00099ms | 0.00076ms | +0.00023ms | +30.84% |
| min | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| max | 0.01ms | 0.0064ms | +0.0083ms | +130.07% |
| total | 0.04ms | 0.03ms | +0.0094ms | +30.84% |

### simulateReconnect

# Perf Report — simulateReconnect.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.0037ms |
| p99 | 0.0075ms |
| mean | 0.00099ms |
| stdev | 0.0016ms |
| min | 0.00042ms |
| max | 0.0077ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00046ms | -0.000042ms | -9.17% |
| p50 | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| p95 | 0.0037ms | 0.0031ms | +0.00059ms | +18.84% |
| p99 | 0.0075ms | 0.0062ms | +0.0014ms | +22.20% |
| mean | 0.00099ms | 0.00093ms | +0.000057ms | +6.13% |
| min | 0.00042ms | 0.00046ms | -0.000042ms | -9.17% |
| max | 0.0077ms | 0.0070ms | +0.00075ms | +10.78% |
| total | 0.04ms | 0.04ms | +0.0023ms | +6.13% |

