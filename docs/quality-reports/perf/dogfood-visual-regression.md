# Perf Suite — dogfood-visual-regression

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00046ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00092ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| seedAllBaselines | 0.10ms | 0.64ms | 50ms | 0.00092ms | PASS | stable (p10 +5% (閾値未満)、 p95 +298% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| captureAllScenesNeutral | 0.19ms | 0.91ms | 80ms | 0.00092ms | PASS | stable (p10 +8% (閾値未満)、 p95 +143% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| captureAllScenesChanged | 0.23ms | 0.86ms | 80ms | 0.00092ms | PASS | regressed — gate 無効 (regressionGate=false) |
| acceptAllPendingChanges | 0.21ms | 0.87ms | 80ms | 0.00092ms | PASS | stable (p10 +11% (閾値未満)、 p95 +283% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| seedAllBaselines | 7.88ms | 100ms | PASS |
| captureAllScenesNeutral | 24.00ms | 160ms | PASS |
| captureAllScenesChanged | 13.46ms | 160ms | PASS |
| acceptAllPendingChanges | 82.01ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| seedAllBaselines | 9992 B | 0 B | 102400 B | yes | PASS |
| captureAllScenesNeutral | -1376 B | 0 B | 102400 B | yes | PASS |
| captureAllScenesChanged | 2848 B | 0 B | 102400 B | yes | PASS |
| acceptAllPendingChanges | 55752 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### seedAllBaselines

# Perf Report — seedAllBaselines.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.10ms |
| p50 | 0.12ms |
| p95 | 0.64ms |
| p99 | 0.79ms |
| mean | 0.21ms |
| stdev | 0.20ms |
| min | 0.08ms |
| max | 0.79ms |
| total | 8.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.10ms | 0.09ms | +0.0046ms | +5.10% |
| p50 | 0.12ms | 0.11ms | +0.02ms | +15.49% |
| p95 | 0.64ms | 0.16ms | +0.48ms | +297.78% |
| p99 | 0.79ms | 0.34ms | +0.46ms | +135.85% |
| mean | 0.21ms | 0.12ms | +0.09ms | +73.83% |
| min | 0.08ms | 0.08ms | +0.0075ms | +9.78% |
| max | 0.79ms | 0.45ms | +0.35ms | +77.85% |
| total | 8.37ms | 4.81ms | +3.56ms | +73.83% |

### captureAllScenesNeutral

# Perf Report — captureAllScenesNeutral.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.19ms |
| p50 | 0.23ms |
| p95 | 0.91ms |
| p99 | 2.98ms |
| mean | 0.46ms |
| stdev | 0.62ms |
| min | 0.19ms |
| max | 3.83ms |
| total | 18.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.19ms | 0.18ms | +0.01ms | +8.08% |
| p50 | 0.23ms | 0.19ms | +0.04ms | +21.12% |
| p95 | 0.91ms | 0.37ms | +0.54ms | +143.30% |
| p99 | 2.98ms | 0.42ms | +2.57ms | +617.72% |
| mean | 0.46ms | 0.20ms | +0.25ms | +123.78% |
| min | 0.19ms | 0.18ms | +0.02ms | +9.45% |
| max | 3.83ms | 0.43ms | +3.40ms | +795.47% |
| total | 18.22ms | 8.14ms | +10.08ms | +123.78% |

### captureAllScenesChanged

# Perf Report — captureAllScenesChanged.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.23ms |
| p50 | 0.24ms |
| p95 | 0.86ms |
| p99 | 0.92ms |
| mean | 0.34ms |
| stdev | 0.21ms |
| min | 0.20ms |
| max | 0.94ms |
| total | 13.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.23ms | 0.18ms | +0.05ms | +30.59% |
| p50 | 0.24ms | 0.18ms | +0.06ms | +33.42% |
| p95 | 0.86ms | 0.23ms | +0.63ms | +274.83% |
| p99 | 0.92ms | 0.39ms | +0.53ms | +137.23% |
| mean | 0.34ms | 0.20ms | +0.14ms | +72.09% |
| min | 0.20ms | 0.17ms | +0.03ms | +18.99% |
| max | 0.94ms | 0.48ms | +0.46ms | +94.86% |
| total | 13.55ms | 7.87ms | +5.67ms | +72.09% |

### acceptAllPendingChanges

# Perf Report — acceptAllPendingChanges.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.21ms |
| p50 | 0.23ms |
| p95 | 0.87ms |
| p99 | 15.98ms |
| mean | 0.92ms |
| stdev | 3.96ms |
| min | 0.20ms |
| max | 25.33ms |
| total | 36.70ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.21ms | 0.19ms | +0.02ms | +11.11% |
| p50 | 0.23ms | 0.20ms | +0.03ms | +17.66% |
| p95 | 0.87ms | 0.23ms | +0.64ms | +282.75% |
| p99 | 15.98ms | 0.46ms | +15.51ms | +3341.72% |
| mean | 0.92ms | 0.21ms | +0.71ms | +339.51% |
| min | 0.20ms | 0.19ms | +0.02ms | +8.77% |
| max | 25.33ms | 0.53ms | +24.81ms | +4719.05% |
| total | 36.70ms | 8.35ms | +28.35ms | +339.51% |

