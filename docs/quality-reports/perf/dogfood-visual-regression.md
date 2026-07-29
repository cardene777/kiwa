# Perf Suite — dogfood-visual-regression

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| seedAllBaselines | 0.09ms | 0.19ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureAllScenesNeutral | 0.18ms | 0.99ms | 80ms | 0.00033ms | PASS | stable (p10 +3% (閾値未満)、 p95 +165% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| captureAllScenesChanged | 0.20ms | 0.24ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| acceptAllPendingChanges | 0.22ms | 0.65ms | 80ms | 0.00033ms | PASS | stable (p10 +19% (閾値未満)、 p95 +185% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| seedAllBaselines | 5.35ms | 100ms | PASS |
| captureAllScenesNeutral | 3.46ms | 160ms | PASS |
| captureAllScenesChanged | 3.64ms | 160ms | PASS |
| acceptAllPendingChanges | 3.23ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| seedAllBaselines | 19232 B | 0 B | 102400 B | yes | PASS |
| captureAllScenesNeutral | -44992 B | 0 B | 102400 B | yes | PASS |
| captureAllScenesChanged | 6384 B | 0 B | 102400 B | yes | PASS |
| acceptAllPendingChanges | 46264 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### seedAllBaselines

# Perf Report — seedAllBaselines.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.09ms |
| p50 | 0.12ms |
| p95 | 0.19ms |
| p99 | 0.41ms |
| mean | 0.13ms |
| stdev | 0.07ms |
| min | 0.09ms |
| max | 0.51ms |
| total | 5.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.09ms | 0.09ms | -0.0024ms | -2.68% |
| p50 | 0.12ms | 0.11ms | +0.0089ms | +8.26% |
| p95 | 0.19ms | 0.16ms | +0.03ms | +17.51% |
| p99 | 0.41ms | 0.34ms | +0.08ms | +22.53% |
| mean | 0.13ms | 0.12ms | +0.01ms | +10.65% |
| min | 0.09ms | 0.08ms | +0.01ms | +14.01% |
| max | 0.51ms | 0.45ms | +0.07ms | +14.82% |
| total | 5.33ms | 4.81ms | +0.51ms | +10.65% |

### captureAllScenesNeutral

# Perf Report — captureAllScenesNeutral.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.18ms |
| p50 | 0.20ms |
| p95 | 0.99ms |
| p99 | 1.82ms |
| mean | 0.32ms |
| stdev | 0.37ms |
| min | 0.18ms |
| max | 2.18ms |
| total | 12.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.18ms | 0.18ms | +0.0056ms | +3.14% |
| p50 | 0.20ms | 0.19ms | +0.0087ms | +4.64% |
| p95 | 0.99ms | 0.37ms | +0.62ms | +164.93% |
| p99 | 1.82ms | 0.42ms | +1.40ms | +337.40% |
| mean | 0.32ms | 0.20ms | +0.11ms | +54.79% |
| min | 0.18ms | 0.18ms | +0.0063ms | +3.60% |
| max | 2.18ms | 0.43ms | +1.76ms | +410.42% |
| total | 12.60ms | 8.14ms | +4.46ms | +54.79% |

### captureAllScenesChanged

# Perf Report — captureAllScenesChanged.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.20ms |
| p50 | 0.21ms |
| p95 | 0.24ms |
| p99 | 0.47ms |
| mean | 0.22ms |
| stdev | 0.06ms |
| min | 0.20ms |
| max | 0.57ms |
| total | 8.88ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.20ms | 0.18ms | +0.02ms | +12.11% |
| p50 | 0.21ms | 0.18ms | +0.02ms | +13.59% |
| p95 | 0.24ms | 0.23ms | +0.0087ms | +3.78% |
| p99 | 0.47ms | 0.39ms | +0.08ms | +21.18% |
| mean | 0.22ms | 0.20ms | +0.03ms | +12.80% |
| min | 0.20ms | 0.17ms | +0.02ms | +14.23% |
| max | 0.57ms | 0.48ms | +0.09ms | +19.09% |
| total | 8.88ms | 7.87ms | +1.01ms | +12.80% |

### acceptAllPendingChanges

# Perf Report — acceptAllPendingChanges.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.22ms |
| p50 | 0.27ms |
| p95 | 0.65ms |
| p99 | 0.70ms |
| mean | 0.31ms |
| stdev | 0.13ms |
| min | 0.22ms |
| max | 0.73ms |
| total | 12.56ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.22ms | 0.19ms | +0.04ms | +19.33% |
| p50 | 0.27ms | 0.20ms | +0.08ms | +39.24% |
| p95 | 0.65ms | 0.23ms | +0.42ms | +185.14% |
| p99 | 0.70ms | 0.46ms | +0.24ms | +51.29% |
| mean | 0.31ms | 0.21ms | +0.11ms | +50.49% |
| min | 0.22ms | 0.19ms | +0.04ms | +19.70% |
| max | 0.73ms | 0.53ms | +0.21ms | +39.67% |
| total | 12.56ms | 8.35ms | +4.22ms | +50.49% |

