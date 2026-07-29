# Perf Suite — dogfood-visual-regression

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| seedAllBaselines | 0.09ms | 0.22ms | 50ms | 0.00033ms | PASS | stable (p10 -3% (閾値未満)、 p95 +36% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| captureAllScenesNeutral | 0.19ms | 0.39ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureAllScenesChanged | 0.19ms | 0.40ms | 80ms | 0.00033ms | PASS | stable (p10 +9% (閾値未満)、 p95 +73% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| acceptAllPendingChanges | 0.20ms | 0.28ms | 80ms | 0.00033ms | PASS | stable (p10 +4% (閾値未満)、 p95 +21% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| seedAllBaselines | 2.21ms | 100ms | PASS |
| captureAllScenesNeutral | 3.25ms | 160ms | PASS |
| captureAllScenesChanged | 4.06ms | 160ms | PASS |
| acceptAllPendingChanges | 3.25ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| seedAllBaselines | 19288 B | 0 B | 102400 B | yes | PASS |
| captureAllScenesNeutral | -46320 B | 0 B | 102400 B | yes | PASS |
| captureAllScenesChanged | 6272 B | 0 B | 102400 B | yes | PASS |
| acceptAllPendingChanges | 52184 B | 0 B | 102400 B | yes | PASS |

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
| p99 | 0.40ms |
| mean | 0.13ms |
| stdev | 0.07ms |
| min | 0.08ms |
| max | 0.46ms |
| total | 5.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.09ms | 0.09ms | -0.0024ms | -2.68% |
| p50 | 0.11ms | 0.11ms | -0.00077ms | -0.72% |
| p95 | 0.22ms | 0.16ms | +0.06ms | +35.88% |
| p99 | 0.40ms | 0.34ms | +0.07ms | +19.66% |
| mean | 0.13ms | 0.12ms | +0.0093ms | +7.75% |
| min | 0.08ms | 0.08ms | +0.0017ms | +2.17% |
| max | 0.46ms | 0.45ms | +0.01ms | +2.78% |
| total | 5.19ms | 4.81ms | +0.37ms | +7.75% |

### captureAllScenesNeutral

# Perf Report — captureAllScenesNeutral.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.19ms |
| p50 | 0.20ms |
| p95 | 0.39ms |
| p99 | 0.48ms |
| mean | 0.23ms |
| stdev | 0.08ms |
| min | 0.19ms |
| max | 0.52ms |
| total | 9.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.19ms | 0.18ms | +0.010ms | +5.57% |
| p50 | 0.20ms | 0.19ms | +0.01ms | +5.39% |
| p95 | 0.39ms | 0.37ms | +0.01ms | +2.74% |
| p99 | 0.48ms | 0.42ms | +0.07ms | +15.99% |
| mean | 0.23ms | 0.20ms | +0.03ms | +14.96% |
| min | 0.19ms | 0.18ms | +0.01ms | +6.70% |
| max | 0.52ms | 0.43ms | +0.09ms | +20.58% |
| total | 9.36ms | 8.14ms | +1.22ms | +14.96% |

### captureAllScenesChanged

# Perf Report — captureAllScenesChanged.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.19ms |
| p50 | 0.20ms |
| p95 | 0.40ms |
| p99 | 0.64ms |
| mean | 0.24ms |
| stdev | 0.10ms |
| min | 0.19ms |
| max | 0.68ms |
| total | 9.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.19ms | 0.18ms | +0.02ms | +9.11% |
| p50 | 0.20ms | 0.18ms | +0.02ms | +9.50% |
| p95 | 0.40ms | 0.23ms | +0.17ms | +73.24% |
| p99 | 0.64ms | 0.39ms | +0.25ms | +65.34% |
| mean | 0.24ms | 0.20ms | +0.04ms | +19.68% |
| min | 0.19ms | 0.17ms | +0.02ms | +11.47% |
| max | 0.68ms | 0.48ms | +0.20ms | +42.39% |
| total | 9.42ms | 7.87ms | +1.55ms | +19.68% |

### acceptAllPendingChanges

# Perf Report — acceptAllPendingChanges.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.20ms |
| p50 | 0.23ms |
| p95 | 0.28ms |
| p99 | 0.42ms |
| mean | 0.24ms |
| stdev | 0.05ms |
| min | 0.19ms |
| max | 0.42ms |
| total | 9.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.20ms | 0.19ms | +0.0076ms | +4.06% |
| p50 | 0.23ms | 0.20ms | +0.04ms | +18.17% |
| p95 | 0.28ms | 0.23ms | +0.05ms | +21.33% |
| p99 | 0.42ms | 0.46ms | -0.04ms | -9.32% |
| mean | 0.24ms | 0.21ms | +0.03ms | +13.75% |
| min | 0.19ms | 0.19ms | +0.0056ms | +3.01% |
| max | 0.42ms | 0.53ms | -0.10ms | -19.44% |
| total | 9.50ms | 8.35ms | +1.15ms | +13.75% |

