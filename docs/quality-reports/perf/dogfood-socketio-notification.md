# Perf Suite — dogfood-socketio-notification

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| subscribeRoom | 3.27ms | 3.59ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| deliverNotification | 3.33ms | 3.47ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| getPending | 0.00033ms | 0.0023ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| simulateReconnect | 0.00042ms | 0.0034ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| subscribeRoom | 3.64ms | 100ms | PASS |
| deliverNotification | 3.51ms | 60ms | PASS |
| getPending | 0.00ms | 60ms | PASS |
| simulateReconnect | 0.01ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| subscribeRoom | 90440 B | 0 B | 102400 B | yes | PASS |
| deliverNotification | 38712 B | 0 B | 102400 B | yes | PASS |
| getPending | 32872 B | 0 B | 102400 B | yes | PASS |
| simulateReconnect | 45912 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### subscribeRoom

# Perf Report — subscribeRoom.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.27ms |
| p50 | 3.48ms |
| p95 | 3.59ms |
| p99 | 3.63ms |
| mean | 3.43ms |
| stdev | 0.21ms |
| min | 2.32ms |
| max | 3.64ms |
| total | 137.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.27ms | 3.35ms | -0.07ms | -2.18% |
| p50 | 3.48ms | 3.45ms | +0.03ms | +0.88% |
| p95 | 3.59ms | 3.52ms | +0.07ms | +1.91% |
| p99 | 3.63ms | 3.63ms | +0.00096ms | +0.03% |
| mean | 3.43ms | 3.42ms | +0.02ms | +0.49% |
| min | 2.32ms | 2.36ms | -0.04ms | -1.74% |
| max | 3.64ms | 3.68ms | -0.05ms | -1.33% |
| total | 137.35ms | 136.68ms | +0.67ms | +0.49% |

### deliverNotification

# Perf Report — deliverNotification.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.33ms |
| p50 | 3.43ms |
| p95 | 3.47ms |
| p99 | 3.49ms |
| mean | 3.41ms |
| stdev | 0.07ms |
| min | 3.13ms |
| max | 3.49ms |
| total | 136.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.33ms | 3.18ms | +0.14ms | +4.48% |
| p50 | 3.43ms | 3.45ms | -0.01ms | -0.39% |
| p95 | 3.47ms | 3.53ms | -0.06ms | -1.63% |
| p99 | 3.49ms | 3.77ms | -0.28ms | -7.52% |
| mean | 3.41ms | 3.35ms | +0.07ms | +2.08% |
| min | 3.13ms | 2.29ms | +0.84ms | +36.77% |
| max | 3.49ms | 3.87ms | -0.38ms | -9.80% |
| total | 136.59ms | 133.81ms | +2.78ms | +2.08% |

### getPending

# Perf Report — getPending.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.0023ms |
| p99 | 0.0041ms |
| mean | 0.00071ms |
| stdev | 0.00091ms |
| min | 0.00033ms |
| max | 0.0049ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | -0.0000010ms | -0.30% |
| p50 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p95 | 0.0023ms | 0.0023ms | +0.000050ms | +2.21% |
| p99 | 0.0041ms | 0.0050ms | -0.00083ms | -16.80% |
| mean | 0.00071ms | 0.00076ms | -0.000047ms | -6.16% |
| min | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| max | 0.0049ms | 0.0064ms | -0.0015ms | -23.53% |
| total | 0.03ms | 0.03ms | -0.0019ms | -6.16% |

### simulateReconnect

# Perf Report — simulateReconnect.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.0034ms |
| p99 | 0.0073ms |
| mean | 0.00096ms |
| stdev | 0.0016ms |
| min | 0.00042ms |
| max | 0.0073ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00046ms | -0.000041ms | -8.97% |
| p50 | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| p95 | 0.0034ms | 0.0031ms | +0.00027ms | +8.68% |
| p99 | 0.0073ms | 0.0062ms | +0.0011ms | +18.22% |
| mean | 0.00096ms | 0.00093ms | +0.000028ms | +3.02% |
| min | 0.00042ms | 0.00046ms | -0.000042ms | -9.17% |
| max | 0.0073ms | 0.0070ms | +0.00038ms | +5.39% |
| total | 0.04ms | 0.04ms | +0.0011ms | +3.02% |

