# Perf Suite — dogfood-visual-regression

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| seedAllBaselines | 0.09ms | 0.22ms | 50ms | 0.00036ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureAllScenesNeutral | 0.18ms | 0.34ms | 80ms | 0.00038ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureAllScenesChanged | 0.17ms | 0.19ms | 80ms | 0.00037ms | PASS | stable — gate 無効 (regressionGate=false) |
| acceptAllPendingChanges | 0.19ms | 0.22ms | 80ms | 0.00036ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| seedAllBaselines | cpu | 0.08ms | 0.09ms | 1.080 | 1.135 | 0.10ms | 0.10ms |
| captureAllScenesNeutral | cpu | 0.08ms | 0.18ms | 2.164 | 2.205 | 0.20ms | 0.21ms |
| captureAllScenesChanged | cpu | 0.08ms | 0.17ms | 2.087 | 2.155 | 0.19ms | 0.19ms |
| acceptAllPendingChanges | cpu | 0.08ms | 0.19ms | 2.273 | 2.392 | 0.20ms | 0.21ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| seedAllBaselines | 1.11ms | 100ms | PASS |
| captureAllScenesNeutral | 2.15ms | 160ms | PASS |
| captureAllScenesChanged | 2.03ms | 160ms | PASS |
| acceptAllPendingChanges | 2.15ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| seedAllBaselines | 1608 B | 0 B | 102400 B | yes | PASS |
| captureAllScenesNeutral | 3200 B | 0 B | 102400 B | yes | PASS |
| captureAllScenesChanged | -78064 B | 0 B | 102400 B | yes | PASS |
| acceptAllPendingChanges | -9488 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### seedAllBaselines

# Perf Report — seedAllBaselines.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.09ms |
| p50 | 0.11ms |
| p95 | 0.22ms |
| p99 | 0.37ms |
| mean | 0.12ms |
| stdev | 0.06ms |
| min | 0.08ms |
| max | 0.42ms |
| total | 4.98ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.09ms | 0.10ms | -0.01ms | -12.97% |
| p50 | 0.11ms | 0.12ms | -0.01ms | -9.04% |
| p95 | 0.22ms | 0.21ms | +0.02ms | +8.85% |
| p99 | 0.37ms | 1.45ms | -1.08ms | -74.62% |
| mean | 0.12ms | 0.18ms | -0.06ms | -30.94% |
| min | 0.08ms | 0.09ms | -0.02ms | -16.86% |
| max | 0.42ms | 1.99ms | -1.57ms | -78.96% |
| total | 4.98ms | 7.20ms | -2.23ms | -30.94% |

### captureAllScenesNeutral

# Perf Report — captureAllScenesNeutral.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.18ms |
| p50 | 0.18ms |
| p95 | 0.34ms |
| p99 | 0.42ms |
| mean | 0.21ms |
| stdev | 0.06ms |
| min | 0.18ms |
| max | 0.42ms |
| total | 8.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.18ms | 0.21ms | -0.03ms | -13.78% |
| p50 | 0.18ms | 0.21ms | -0.03ms | -13.79% |
| p95 | 0.34ms | 0.43ms | -0.09ms | -20.42% |
| p99 | 0.42ms | 0.79ms | -0.37ms | -46.65% |
| mean | 0.21ms | 0.26ms | -0.05ms | -20.38% |
| min | 0.18ms | 0.20ms | -0.02ms | -12.38% |
| max | 0.42ms | 0.97ms | -0.54ms | -56.23% |
| total | 8.25ms | 10.37ms | -2.11ms | -20.38% |

### captureAllScenesChanged

# Perf Report — captureAllScenesChanged.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.17ms |
| p50 | 0.17ms |
| p95 | 0.19ms |
| p99 | 0.29ms |
| mean | 0.18ms |
| stdev | 0.03ms |
| min | 0.17ms |
| max | 0.36ms |
| total | 7.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.17ms | 0.19ms | -0.02ms | -12.23% |
| p50 | 0.17ms | 0.20ms | -0.02ms | -11.38% |
| p95 | 0.19ms | 0.37ms | -0.18ms | -48.90% |
| p99 | 0.29ms | 0.77ms | -0.48ms | -62.01% |
| mean | 0.18ms | 0.23ms | -0.05ms | -21.52% |
| min | 0.17ms | 0.19ms | -0.02ms | -12.66% |
| max | 0.36ms | 0.92ms | -0.57ms | -61.47% |
| total | 7.23ms | 9.21ms | -1.98ms | -21.52% |

### acceptAllPendingChanges

# Perf Report — acceptAllPendingChanges.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.19ms |
| p50 | 0.19ms |
| p95 | 0.22ms |
| p99 | 0.40ms |
| mean | 0.20ms |
| stdev | 0.05ms |
| min | 0.19ms |
| max | 0.42ms |
| total | 8.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.19ms | 0.21ms | -0.03ms | -12.89% |
| p50 | 0.19ms | 0.25ms | -0.07ms | -25.64% |
| p95 | 0.22ms | 0.60ms | -0.38ms | -63.65% |
| p99 | 0.40ms | 1.11ms | -0.71ms | -63.90% |
| mean | 0.20ms | 0.31ms | -0.11ms | -35.30% |
| min | 0.19ms | 0.21ms | -0.03ms | -12.14% |
| max | 0.42ms | 1.21ms | -0.78ms | -64.77% |
| total | 8.11ms | 12.53ms | -4.42ms | -35.30% |

