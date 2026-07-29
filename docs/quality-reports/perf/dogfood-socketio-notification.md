# Perf Suite — dogfood-socketio-notification

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| subscribeRoom | 3.43ms | 3.52ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| deliverNotification | 3.44ms | 3.53ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| getPending | 0.00033ms | 0.0035ms | 30ms | 0.00033ms | PASS | stable (p10 -0% (閾値未満)、 p95 +54% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| simulateReconnect | 0.00042ms | 0.0034ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| subscribeRoom | 3.57ms | 100ms | PASS |
| deliverNotification | 3.52ms | 60ms | PASS |
| getPending | 0.00ms | 60ms | PASS |
| simulateReconnect | 0.01ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| subscribeRoom | 90408 B | 0 B | 102400 B | yes | PASS |
| deliverNotification | 38712 B | 0 B | 102400 B | yes | PASS |
| getPending | 20056 B | 0 B | 102400 B | yes | PASS |
| simulateReconnect | 43544 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### subscribeRoom

# Perf Report — subscribeRoom.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.43ms |
| p50 | 3.47ms |
| p95 | 3.52ms |
| p99 | 3.56ms |
| mean | 3.46ms |
| stdev | 0.05ms |
| min | 3.25ms |
| max | 3.57ms |
| total | 138.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.43ms | 3.35ms | +0.09ms | +2.59% |
| p50 | 3.47ms | 3.45ms | +0.02ms | +0.65% |
| p95 | 3.52ms | 3.52ms | -0.0016ms | -0.04% |
| p99 | 3.56ms | 3.63ms | -0.07ms | -1.84% |
| mean | 3.46ms | 3.42ms | +0.05ms | +1.39% |
| min | 3.25ms | 2.36ms | +0.89ms | +37.61% |
| max | 3.57ms | 3.68ms | -0.12ms | -3.17% |
| total | 138.58ms | 136.68ms | +1.90ms | +1.39% |

### deliverNotification

# Perf Report — deliverNotification.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.44ms |
| p50 | 3.47ms |
| p95 | 3.53ms |
| p99 | 3.55ms |
| mean | 3.43ms |
| stdev | 0.19ms |
| min | 2.31ms |
| max | 3.55ms |
| total | 137.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.44ms | 3.18ms | +0.25ms | +7.86% |
| p50 | 3.47ms | 3.45ms | +0.02ms | +0.71% |
| p95 | 3.53ms | 3.53ms | +0.0035ms | +0.10% |
| p99 | 3.55ms | 3.77ms | -0.22ms | -5.83% |
| mean | 3.43ms | 3.35ms | +0.09ms | +2.67% |
| min | 2.31ms | 2.29ms | +0.02ms | +0.96% |
| max | 3.55ms | 3.87ms | -0.32ms | -8.19% |
| total | 137.39ms | 133.81ms | +3.57ms | +2.67% |

### getPending

# Perf Report — getPending.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.0035ms |
| p99 | 0.0052ms |
| mean | 0.00079ms |
| stdev | 0.0012ms |
| min | 0.00029ms |
| max | 0.0058ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | -0.0000010ms | -0.30% |
| p50 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p95 | 0.0035ms | 0.0023ms | +0.0012ms | +53.65% |
| p99 | 0.0052ms | 0.0050ms | +0.00021ms | +4.28% |
| mean | 0.00079ms | 0.00076ms | +0.000031ms | +4.10% |
| min | 0.00029ms | 0.00033ms | -0.000041ms | -12.31% |
| max | 0.0058ms | 0.0064ms | -0.00058ms | -9.16% |
| total | 0.03ms | 0.03ms | +0.0012ms | +4.10% |

### simulateReconnect

# Perf Report — simulateReconnect.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.0034ms |
| p99 | 0.0092ms |
| mean | 0.0011ms |
| stdev | 0.0019ms |
| min | 0.00042ms |
| max | 0.01ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00046ms | -0.000041ms | -8.95% |
| p50 | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| p95 | 0.0034ms | 0.0031ms | +0.00031ms | +9.75% |
| p99 | 0.0092ms | 0.0062ms | +0.0030ms | +48.84% |
| mean | 0.0011ms | 0.00093ms | +0.00015ms | +16.36% |
| min | 0.00042ms | 0.00046ms | -0.000042ms | -9.17% |
| max | 0.01ms | 0.0070ms | +0.0030ms | +43.72% |
| total | 0.04ms | 0.04ms | +0.0061ms | +16.36% |

