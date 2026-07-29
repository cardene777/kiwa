# Perf Suite — dogfood-socketio-notification

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| subscribeRoom | 3.60ms | 3.85ms | 50ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| deliverNotification | 3.34ms | 3.96ms | 30ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| getPending | 0.00029ms | 0.0027ms | 30ms | 0.00034ms | PASS | stable (検知には +0.00034ms (baseline 比 +102%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| simulateReconnect | 0.00033ms | 0.0029ms | 100ms | 0.00035ms | PASS | stable (検知には +0.00035ms (baseline 比 +104%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| subscribeRoom | cpu | 0.08ms | 3.60ms | 44.201 | 41.063 | 3.69ms | 3.43ms |
| deliverNotification | cpu | 0.08ms | 3.34ms | 40.896 | 41.658 | 3.38ms | 3.44ms |
| getPending | cpu | 0.08ms | 0.00029ms | 0.004 | 0.004 | 0.00030ms | 0.00033ms |
| simulateReconnect | cpu | 0.08ms | 0.00033ms | 0.004 | 0.004 | 0.00034ms | 0.00033ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| subscribeRoom | 3.92ms | 100ms | PASS |
| deliverNotification | 3.96ms | 60ms | PASS |
| getPending | 0.01ms | 60ms | PASS |
| simulateReconnect | 0.00ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| subscribeRoom | 83840 B | 0 B | 102400 B | yes | PASS |
| deliverNotification | 39960 B | 0 B | 102400 B | yes | PASS |
| getPending | 33136 B | 0 B | 102400 B | yes | PASS |
| simulateReconnect | 46640 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### subscribeRoom

# Perf Report — subscribeRoom.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.60ms |
| p50 | 3.81ms |
| p95 | 3.85ms |
| p99 | 3.86ms |
| mean | 3.72ms |
| stdev | 0.28ms |
| min | 2.56ms |
| max | 3.87ms |
| total | 148.95ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.60ms | 3.43ms | +0.18ms | +5.12% |
| p50 | 3.81ms | 3.47ms | +0.34ms | +9.80% |
| p95 | 3.85ms | 3.52ms | +0.34ms | +9.63% |
| p99 | 3.86ms | 3.52ms | +0.34ms | +9.60% |
| mean | 3.72ms | 3.44ms | +0.28ms | +8.25% |
| min | 2.56ms | 2.39ms | +0.16ms | +6.79% |
| max | 3.87ms | 3.53ms | +0.34ms | +9.61% |
| total | 148.95ms | 137.59ms | +11.36ms | +8.25% |

### deliverNotification

# Perf Report — deliverNotification.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.34ms |
| p50 | 3.81ms |
| p95 | 3.96ms |
| p99 | 4.27ms |
| mean | 3.74ms |
| stdev | 0.29ms |
| min | 2.59ms |
| max | 4.33ms |
| total | 149.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.34ms | 3.44ms | -0.10ms | -2.91% |
| p50 | 3.81ms | 3.48ms | +0.33ms | +9.49% |
| p95 | 3.96ms | 3.68ms | +0.28ms | +7.66% |
| p99 | 4.27ms | 3.75ms | +0.52ms | +13.90% |
| mean | 3.74ms | 3.46ms | +0.27ms | +7.93% |
| min | 2.59ms | 2.35ms | +0.24ms | +10.33% |
| max | 4.33ms | 3.78ms | +0.55ms | +14.41% |
| total | 149.49ms | 138.50ms | +10.99ms | +7.93% |

### getPending

# Perf Report — getPending.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.0027ms |
| p99 | 0.0042ms |
| mean | 0.00068ms |
| stdev | 0.00094ms |
| min | 0.00029ms |
| max | 0.0051ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00033ms | -0.000041ms | -12.31% |
| p50 | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| p95 | 0.0027ms | 0.0050ms | -0.0023ms | -45.86% |
| p99 | 0.0042ms | 0.0058ms | -0.0015ms | -26.66% |
| mean | 0.00068ms | 0.00091ms | -0.00024ms | -25.97% |
| min | 0.00029ms | 0.00029ms | -0.0000010ms | -0.34% |
| max | 0.0051ms | 0.0060ms | -0.00092ms | -15.28% |
| total | 0.03ms | 0.04ms | -0.0095ms | -25.97% |

### simulateReconnect

# Perf Report — simulateReconnect.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00033ms |
| p95 | 0.0029ms |
| p99 | 0.0066ms |
| mean | 0.00081ms |
| stdev | 0.0014ms |
| min | 0.00029ms |
| max | 0.0068ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| p50 | 0.00033ms | 0.00038ms | -0.000041ms | -10.93% |
| p95 | 0.0029ms | 0.0033ms | -0.00042ms | -12.69% |
| p99 | 0.0066ms | 0.0078ms | -0.0012ms | -15.38% |
| mean | 0.00081ms | 0.00094ms | -0.00013ms | -14.05% |
| min | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| max | 0.0068ms | 0.0079ms | -0.0011ms | -13.69% |
| total | 0.03ms | 0.04ms | -0.0053ms | -14.05% |

