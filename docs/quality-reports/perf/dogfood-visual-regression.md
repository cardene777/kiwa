# Perf Suite — dogfood-visual-regression

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| seedAllBaselines | 0.09ms | 0.18ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureAllScenesNeutral | 0.17ms | 0.32ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureAllScenesChanged | 0.17ms | 0.25ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| acceptAllPendingChanges | 0.19ms | 0.30ms | 80ms | 0.00033ms | PASS | stable (p10 -1% (閾値未満)、 p95 +33% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| seedAllBaselines | 0.99ms | 100ms | PASS |
| captureAllScenesNeutral | 2.32ms | 160ms | PASS |
| captureAllScenesChanged | 2.10ms | 160ms | PASS |
| acceptAllPendingChanges | 2.18ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| seedAllBaselines | 816 B | 0 B | 102400 B | yes | PASS |
| captureAllScenesNeutral | 784 B | 0 B | 102400 B | yes | PASS |
| captureAllScenesChanged | -77728 B | 0 B | 102400 B | yes | PASS |
| acceptAllPendingChanges | -9008 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### seedAllBaselines

# Perf Report — seedAllBaselines.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.09ms |
| p50 | 0.11ms |
| p95 | 0.18ms |
| p99 | 0.31ms |
| mean | 0.12ms |
| stdev | 0.05ms |
| min | 0.08ms |
| max | 0.37ms |
| total | 4.90ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.09ms | 0.09ms | -0.0055ms | -6.03% |
| p50 | 0.11ms | 0.11ms | +0.0056ms | +5.23% |
| p95 | 0.18ms | 0.16ms | +0.02ms | +10.12% |
| p99 | 0.31ms | 0.34ms | -0.03ms | -8.53% |
| mean | 0.12ms | 0.12ms | +0.0022ms | +1.83% |
| min | 0.08ms | 0.08ms | -0.00025ms | -0.32% |
| max | 0.37ms | 0.45ms | -0.07ms | -16.76% |
| total | 4.90ms | 4.81ms | +0.09ms | +1.83% |

### captureAllScenesNeutral

# Perf Report — captureAllScenesNeutral.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.17ms |
| p50 | 0.17ms |
| p95 | 0.32ms |
| p99 | 0.41ms |
| mean | 0.19ms |
| stdev | 0.06ms |
| min | 0.17ms |
| max | 0.45ms |
| total | 7.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.17ms | 0.18ms | -0.01ms | -6.30% |
| p50 | 0.17ms | 0.19ms | -0.01ms | -7.83% |
| p95 | 0.32ms | 0.37ms | -0.05ms | -14.38% |
| p99 | 0.41ms | 0.42ms | -0.0060ms | -1.45% |
| mean | 0.19ms | 0.20ms | -0.01ms | -6.63% |
| min | 0.17ms | 0.18ms | -0.01ms | -5.82% |
| max | 0.45ms | 0.43ms | +0.02ms | +5.83% |
| total | 7.60ms | 8.14ms | -0.54ms | -6.63% |

### captureAllScenesChanged

# Perf Report — captureAllScenesChanged.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.17ms |
| p50 | 0.18ms |
| p95 | 0.25ms |
| p99 | 0.40ms |
| mean | 0.20ms |
| stdev | 0.05ms |
| min | 0.17ms |
| max | 0.43ms |
| total | 7.81ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.17ms | 0.18ms | -0.0036ms | -2.01% |
| p50 | 0.18ms | 0.18ms | -0.0033ms | -1.80% |
| p95 | 0.25ms | 0.23ms | +0.02ms | +9.54% |
| p99 | 0.40ms | 0.39ms | +0.02ms | +4.92% |
| mean | 0.20ms | 0.20ms | -0.0015ms | -0.74% |
| min | 0.17ms | 0.17ms | -0.0037ms | -2.15% |
| max | 0.43ms | 0.48ms | -0.05ms | -9.55% |
| total | 7.81ms | 7.87ms | -0.06ms | -0.74% |

### acceptAllPendingChanges

# Perf Report — acceptAllPendingChanges.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.19ms |
| p50 | 0.19ms |
| p95 | 0.30ms |
| p99 | 0.41ms |
| mean | 0.21ms |
| stdev | 0.05ms |
| min | 0.19ms |
| max | 0.42ms |
| total | 8.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.19ms | 0.19ms | -0.0012ms | -0.65% |
| p50 | 0.19ms | 0.20ms | -0.0018ms | -0.90% |
| p95 | 0.30ms | 0.23ms | +0.08ms | +33.34% |
| p99 | 0.41ms | 0.46ms | -0.05ms | -11.23% |
| mean | 0.21ms | 0.21ms | +0.00057ms | +0.27% |
| min | 0.19ms | 0.19ms | -0.0015ms | -0.82% |
| max | 0.42ms | 0.53ms | -0.11ms | -20.47% |
| total | 8.37ms | 8.35ms | +0.02ms | +0.27% |

