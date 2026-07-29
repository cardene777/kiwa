# Perf Suite — dogfood-socketio-notification

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| subscribeRoom | 3.12ms | 4.56ms | 50ms | 0.00033ms | PASS | stable (p10 -7% (閾値未満)、 p95 +29% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| deliverNotification | 3.48ms | 3.87ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| getPending | 0.00033ms | 0.0022ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| simulateReconnect | 0.00046ms | 0.0042ms | 100ms | 0.00033ms | PASS | stable (p10 0% (閾値未満)、 p95 +35% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| subscribeRoom | 4.00ms | 100ms | PASS |
| deliverNotification | 3.92ms | 60ms | PASS |
| getPending | 0.01ms | 60ms | PASS |
| simulateReconnect | 0.00ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| subscribeRoom | 91736 B | 0 B | 102400 B | yes | PASS |
| deliverNotification | 38744 B | 0 B | 102400 B | yes | PASS |
| getPending | 32928 B | 0 B | 102400 B | yes | PASS |
| simulateReconnect | 46720 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### subscribeRoom

# Perf Report — subscribeRoom.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.12ms |
| p50 | 3.87ms |
| p95 | 4.56ms |
| p99 | 4.99ms |
| mean | 3.79ms |
| stdev | 0.50ms |
| min | 2.71ms |
| max | 5.18ms |
| total | 151.76ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.12ms | 3.35ms | -0.22ms | -6.59% |
| p50 | 3.87ms | 3.45ms | +0.43ms | +12.38% |
| p95 | 4.56ms | 3.52ms | +1.03ms | +29.37% |
| p99 | 4.99ms | 3.63ms | +1.37ms | +37.73% |
| mean | 3.79ms | 3.42ms | +0.38ms | +11.04% |
| min | 2.71ms | 2.36ms | +0.34ms | +14.50% |
| max | 5.18ms | 3.68ms | +1.50ms | +40.60% |
| total | 151.76ms | 136.68ms | +15.08ms | +11.04% |

### deliverNotification

# Perf Report — deliverNotification.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.48ms |
| p50 | 3.84ms |
| p95 | 3.87ms |
| p99 | 3.90ms |
| mean | 3.75ms |
| stdev | 0.25ms |
| min | 2.63ms |
| max | 3.92ms |
| total | 149.96ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.48ms | 3.18ms | +0.30ms | +9.35% |
| p50 | 3.84ms | 3.45ms | +0.39ms | +11.36% |
| p95 | 3.87ms | 3.53ms | +0.34ms | +9.77% |
| p99 | 3.90ms | 3.77ms | +0.13ms | +3.43% |
| mean | 3.75ms | 3.35ms | +0.40ms | +12.07% |
| min | 2.63ms | 2.29ms | +0.34ms | +14.97% |
| max | 3.92ms | 3.87ms | +0.04ms | +1.16% |
| total | 149.96ms | 133.81ms | +16.15ms | +12.07% |

### getPending

# Perf Report — getPending.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00033ms |
| p95 | 0.0022ms |
| p99 | 0.0039ms |
| mean | 0.00067ms |
| stdev | 0.00088ms |
| min | 0.00029ms |
| max | 0.0048ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | -0.0000010ms | -0.30% |
| p50 | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| p95 | 0.0022ms | 0.0023ms | -0.000050ms | -2.21% |
| p99 | 0.0039ms | 0.0050ms | -0.0010ms | -21.11% |
| mean | 0.00067ms | 0.00076ms | -0.000091ms | -11.94% |
| min | 0.00029ms | 0.00033ms | -0.000041ms | -12.31% |
| max | 0.0048ms | 0.0064ms | -0.0016ms | -24.85% |
| total | 0.03ms | 0.03ms | -0.0036ms | -11.94% |

### simulateReconnect

# Perf Report — simulateReconnect.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00046ms |
| p95 | 0.0042ms |
| p99 | 0.0070ms |
| mean | 0.00099ms |
| stdev | 0.0015ms |
| min | 0.00042ms |
| max | 0.0077ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p50 | 0.00046ms | 0.00050ms | -0.000041ms | -8.20% |
| p95 | 0.0042ms | 0.0031ms | +0.0011ms | +34.54% |
| p99 | 0.0070ms | 0.0062ms | +0.00088ms | +14.29% |
| mean | 0.00099ms | 0.00093ms | +0.000066ms | +7.07% |
| min | 0.00042ms | 0.00046ms | -0.000041ms | -8.95% |
| max | 0.0077ms | 0.0070ms | +0.00075ms | +10.78% |
| total | 0.04ms | 0.04ms | +0.0026ms | +7.07% |

