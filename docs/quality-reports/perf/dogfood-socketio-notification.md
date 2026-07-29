# Perf Suite — dogfood-socketio-notification

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| subscribeRoom | 3.37ms | 3.51ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| deliverNotification | 3.42ms | 3.56ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| getPending | 0.00033ms | 0.0033ms | 30ms | 0.00033ms | PASS | stable (p10 -0% (閾値未満)、 p95 +43% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| simulateReconnect | 0.00042ms | 0.0036ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| subscribeRoom | 3.67ms | 100ms | PASS |
| deliverNotification | 3.54ms | 60ms | PASS |
| getPending | 0.01ms | 60ms | PASS |
| simulateReconnect | 0.00ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| subscribeRoom | 90392 B | 0 B | 102400 B | yes | PASS |
| deliverNotification | 38744 B | 0 B | 102400 B | yes | PASS |
| getPending | 32984 B | 0 B | 102400 B | yes | PASS |
| simulateReconnect | 45928 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### subscribeRoom

# Perf Report — subscribeRoom.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.37ms |
| p50 | 3.46ms |
| p95 | 3.51ms |
| p99 | 3.57ms |
| mean | 3.44ms |
| stdev | 0.08ms |
| min | 3.18ms |
| max | 3.60ms |
| total | 137.76ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.37ms | 3.35ms | +0.02ms | +0.63% |
| p50 | 3.46ms | 3.45ms | +0.0093ms | +0.27% |
| p95 | 3.51ms | 3.52ms | -0.01ms | -0.31% |
| p99 | 3.57ms | 3.63ms | -0.05ms | -1.50% |
| mean | 3.44ms | 3.42ms | +0.03ms | +0.79% |
| min | 3.18ms | 2.36ms | +0.82ms | +34.64% |
| max | 3.60ms | 3.68ms | -0.09ms | -2.32% |
| total | 137.76ms | 136.68ms | +1.08ms | +0.79% |

### deliverNotification

# Perf Report — deliverNotification.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.42ms |
| p50 | 3.45ms |
| p95 | 3.56ms |
| p99 | 3.72ms |
| mean | 3.45ms |
| stdev | 0.10ms |
| min | 3.12ms |
| max | 3.79ms |
| total | 138.01ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.42ms | 3.18ms | +0.24ms | +7.42% |
| p50 | 3.45ms | 3.45ms | -0.0011ms | -0.03% |
| p95 | 3.56ms | 3.53ms | +0.03ms | +0.86% |
| p99 | 3.72ms | 3.77ms | -0.06ms | -1.56% |
| mean | 3.45ms | 3.35ms | +0.10ms | +3.14% |
| min | 3.12ms | 2.29ms | +0.83ms | +36.24% |
| max | 3.79ms | 3.87ms | -0.08ms | -2.11% |
| total | 138.01ms | 133.81ms | +4.20ms | +3.14% |

### getPending

# Perf Report — getPending.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00033ms |
| p95 | 0.0033ms |
| p99 | 0.0090ms |
| mean | 0.0010ms |
| stdev | 0.0020ms |
| min | 0.00033ms |
| max | 0.01ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | -0.0000010ms | -0.30% |
| p50 | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| p95 | 0.0033ms | 0.0023ms | +0.00099ms | +43.42% |
| p99 | 0.0090ms | 0.0050ms | +0.0041ms | +82.38% |
| mean | 0.0010ms | 0.00076ms | +0.00025ms | +33.13% |
| min | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.0064ms | +0.0052ms | +81.69% |
| total | 0.04ms | 0.03ms | +0.01ms | +33.13% |

### simulateReconnect

# Perf Report — simulateReconnect.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.0036ms |
| p99 | 0.01ms |
| mean | 0.0012ms |
| stdev | 0.0030ms |
| min | 0.00042ms |
| max | 0.02ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00046ms | -0.000041ms | -8.95% |
| p50 | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| p95 | 0.0036ms | 0.0031ms | +0.00045ms | +14.26% |
| p99 | 0.01ms | 0.0062ms | +0.0078ms | +127.11% |
| mean | 0.0012ms | 0.00093ms | +0.00031ms | +33.39% |
| min | 0.00042ms | 0.00046ms | -0.000042ms | -9.17% |
| max | 0.02ms | 0.0070ms | +0.01ms | +167.68% |
| total | 0.05ms | 0.04ms | +0.01ms | +33.39% |

