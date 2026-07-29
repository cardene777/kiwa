# Perf Suite — dogfood-visual-regression

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| seedAllBaselines | 0.09ms | 0.15ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureAllScenesNeutral | 0.17ms | 0.31ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureAllScenesChanged | 0.17ms | 0.20ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| acceptAllPendingChanges | 0.20ms | 0.41ms | 80ms | 0.00033ms | PASS | stable (p10 +8% (閾値未満)、 p95 +82% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| seedAllBaselines | 1.07ms | 100ms | PASS |
| captureAllScenesNeutral | 2.14ms | 160ms | PASS |
| captureAllScenesChanged | 2.12ms | 160ms | PASS |
| acceptAllPendingChanges | 2.23ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| seedAllBaselines | 1280 B | 0 B | 102400 B | yes | PASS |
| captureAllScenesNeutral | -496 B | 0 B | 102400 B | yes | PASS |
| captureAllScenesChanged | 3312 B | 0 B | 102400 B | yes | PASS |
| acceptAllPendingChanges | -9504 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### seedAllBaselines

# Perf Report — seedAllBaselines.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.09ms |
| p50 | 0.10ms |
| p95 | 0.15ms |
| p99 | 0.28ms |
| mean | 0.11ms |
| stdev | 0.04ms |
| min | 0.07ms |
| max | 0.36ms |
| total | 4.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.09ms | 0.09ms | -0.0043ms | -4.73% |
| p50 | 0.10ms | 0.11ms | -0.0033ms | -3.09% |
| p95 | 0.15ms | 0.16ms | -0.01ms | -7.46% |
| p99 | 0.28ms | 0.34ms | -0.05ms | -16.25% |
| mean | 0.11ms | 0.12ms | -0.0065ms | -5.40% |
| min | 0.07ms | 0.08ms | -0.0026ms | -3.42% |
| max | 0.36ms | 0.45ms | -0.08ms | -18.66% |
| total | 4.55ms | 4.81ms | -0.26ms | -5.40% |

### captureAllScenesNeutral

# Perf Report — captureAllScenesNeutral.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.17ms |
| p50 | 0.18ms |
| p95 | 0.31ms |
| p99 | 0.38ms |
| mean | 0.20ms |
| stdev | 0.05ms |
| min | 0.17ms |
| max | 0.42ms |
| total | 8.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.17ms | 0.18ms | -0.0048ms | -2.66% |
| p50 | 0.18ms | 0.19ms | -0.0032ms | -1.72% |
| p95 | 0.31ms | 0.37ms | -0.07ms | -17.39% |
| p99 | 0.38ms | 0.42ms | -0.03ms | -8.03% |
| mean | 0.20ms | 0.20ms | -0.0021ms | -1.01% |
| min | 0.17ms | 0.18ms | -0.0060ms | -3.43% |
| max | 0.42ms | 0.43ms | -0.01ms | -2.83% |
| total | 8.06ms | 8.14ms | -0.08ms | -1.01% |

### captureAllScenesChanged

# Perf Report — captureAllScenesChanged.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.17ms |
| p50 | 0.18ms |
| p95 | 0.20ms |
| p99 | 0.36ms |
| mean | 0.19ms |
| stdev | 0.05ms |
| min | 0.17ms |
| max | 0.46ms |
| total | 7.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.17ms | 0.18ms | -0.0050ms | -2.80% |
| p50 | 0.18ms | 0.18ms | -0.0051ms | -2.78% |
| p95 | 0.20ms | 0.23ms | -0.03ms | -13.30% |
| p99 | 0.36ms | 0.39ms | -0.02ms | -5.51% |
| mean | 0.19ms | 0.20ms | -0.0090ms | -4.58% |
| min | 0.17ms | 0.17ms | -0.0032ms | -1.84% |
| max | 0.46ms | 0.48ms | -0.02ms | -3.58% |
| total | 7.51ms | 7.87ms | -0.36ms | -4.58% |

### acceptAllPendingChanges

# Perf Report — acceptAllPendingChanges.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.20ms |
| p50 | 0.23ms |
| p95 | 0.41ms |
| p99 | 0.48ms |
| mean | 0.25ms |
| stdev | 0.07ms |
| min | 0.19ms |
| max | 0.48ms |
| total | 10.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.20ms | 0.19ms | +0.02ms | +8.46% |
| p50 | 0.23ms | 0.20ms | +0.04ms | +18.55% |
| p95 | 0.41ms | 0.23ms | +0.19ms | +82.18% |
| p99 | 0.48ms | 0.46ms | +0.01ms | +2.89% |
| mean | 0.25ms | 0.21ms | +0.04ms | +21.43% |
| min | 0.19ms | 0.19ms | +0.0062ms | +3.30% |
| max | 0.48ms | 0.53ms | -0.05ms | -8.71% |
| total | 10.14ms | 8.35ms | +1.79ms | +21.43% |

