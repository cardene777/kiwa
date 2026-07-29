# Perf Suite — dogfood-socketio-notification

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| subscribeRoom | 3.36ms | 3.49ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| deliverNotification | 3.41ms | 3.46ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| getPending | 0.00033ms | 0.0070ms | 30ms | 0.00033ms | PASS | stable (p10 -0% (閾値未満)、 p95 +209% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| simulateReconnect | 0.00042ms | 0.0035ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| subscribeRoom | 3.56ms | 100ms | PASS |
| deliverNotification | 3.53ms | 60ms | PASS |
| getPending | 0.01ms | 60ms | PASS |
| simulateReconnect | 0.00ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| subscribeRoom | 90376 B | 0 B | 102400 B | yes | PASS |
| deliverNotification | 39240 B | 0 B | 102400 B | yes | PASS |
| getPending | 32872 B | 0 B | 102400 B | yes | PASS |
| simulateReconnect | 45592 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### subscribeRoom

# Perf Report — subscribeRoom.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.36ms |
| p50 | 3.45ms |
| p95 | 3.49ms |
| p99 | 3.52ms |
| mean | 3.43ms |
| stdev | 0.08ms |
| min | 3.09ms |
| max | 3.52ms |
| total | 137.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.36ms | 3.35ms | +0.01ms | +0.32% |
| p50 | 3.45ms | 3.45ms | +0.0051ms | +0.15% |
| p95 | 3.49ms | 3.52ms | -0.03ms | -0.95% |
| p99 | 3.52ms | 3.63ms | -0.11ms | -2.99% |
| mean | 3.43ms | 3.42ms | +0.01ms | +0.39% |
| min | 3.09ms | 2.36ms | +0.73ms | +30.77% |
| max | 3.52ms | 3.68ms | -0.17ms | -4.49% |
| total | 137.21ms | 136.68ms | +0.53ms | +0.39% |

### deliverNotification

# Perf Report — deliverNotification.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.41ms |
| p50 | 3.44ms |
| p95 | 3.46ms |
| p99 | 3.48ms |
| mean | 3.40ms |
| stdev | 0.18ms |
| min | 2.32ms |
| max | 3.48ms |
| total | 135.97ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.41ms | 3.18ms | +0.22ms | +6.96% |
| p50 | 3.44ms | 3.45ms | -0.01ms | -0.30% |
| p95 | 3.46ms | 3.53ms | -0.07ms | -1.87% |
| p99 | 3.48ms | 3.77ms | -0.29ms | -7.73% |
| mean | 3.40ms | 3.35ms | +0.05ms | +1.61% |
| min | 2.32ms | 2.29ms | +0.03ms | +1.44% |
| max | 3.48ms | 3.87ms | -0.39ms | -10.02% |
| total | 135.97ms | 133.81ms | +2.16ms | +1.61% |

### getPending

# Perf Report — getPending.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00033ms |
| p95 | 0.0070ms |
| p99 | 0.02ms |
| mean | 0.0013ms |
| stdev | 0.0035ms |
| min | 0.00029ms |
| max | 0.02ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | -0.0000010ms | -0.30% |
| p50 | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| p95 | 0.0070ms | 0.0023ms | +0.0047ms | +208.70% |
| p99 | 0.02ms | 0.0050ms | +0.01ms | +209.65% |
| mean | 0.0013ms | 0.00076ms | +0.00054ms | +71.35% |
| min | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| max | 0.02ms | 0.0064ms | +0.01ms | +220.25% |
| total | 0.05ms | 0.03ms | +0.02ms | +71.35% |

### simulateReconnect

# Perf Report — simulateReconnect.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.0035ms |
| p99 | 0.02ms |
| mean | 0.0013ms |
| stdev | 0.0033ms |
| min | 0.00038ms |
| max | 0.02ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00046ms | -0.000041ms | -8.95% |
| p50 | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| p95 | 0.0035ms | 0.0031ms | +0.00037ms | +11.88% |
| p99 | 0.02ms | 0.0062ms | +0.0094ms | +152.51% |
| mean | 0.0013ms | 0.00093ms | +0.00039ms | +41.81% |
| min | 0.00038ms | 0.00046ms | -0.000083ms | -18.12% |
| max | 0.02ms | 0.0070ms | +0.01ms | +189.24% |
| total | 0.05ms | 0.04ms | +0.02ms | +41.81% |

