# Perf Suite — dogfood-visual-regression

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| seedAllBaselines | 0.09ms | 0.19ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureAllScenesNeutral | 0.18ms | 0.42ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureAllScenesChanged | 0.19ms | 0.26ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| acceptAllPendingChanges | 0.19ms | 0.63ms | 80ms | 0.00033ms | PASS | stable (p10 +0% (閾値未満)、 p95 +179% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| seedAllBaselines | 1.42ms | 100ms | PASS |
| captureAllScenesNeutral | 2.32ms | 160ms | PASS |
| captureAllScenesChanged | 3.04ms | 160ms | PASS |
| acceptAllPendingChanges | 2.57ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| seedAllBaselines | 29360 B | 0 B | 102400 B | yes | PASS |
| captureAllScenesNeutral | -1408 B | 0 B | 102400 B | yes | PASS |
| captureAllScenesChanged | -82232 B | 0 B | 102400 B | yes | PASS |
| acceptAllPendingChanges | -6336 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### seedAllBaselines

# Perf Report — seedAllBaselines.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.09ms |
| p50 | 0.11ms |
| p95 | 0.19ms |
| p99 | 0.36ms |
| mean | 0.13ms |
| stdev | 0.06ms |
| min | 0.08ms |
| max | 0.42ms |
| total | 5.02ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.09ms | 0.09ms | -0.00093ms | -1.02% |
| p50 | 0.11ms | 0.11ms | +0.0029ms | +2.68% |
| p95 | 0.19ms | 0.16ms | +0.03ms | +18.94% |
| p99 | 0.36ms | 0.34ms | +0.02ms | +6.74% |
| mean | 0.13ms | 0.12ms | +0.0051ms | +4.25% |
| min | 0.08ms | 0.08ms | +0.0022ms | +2.82% |
| max | 0.42ms | 0.45ms | -0.02ms | -5.51% |
| total | 5.02ms | 4.81ms | +0.20ms | +4.25% |

### captureAllScenesNeutral

# Perf Report — captureAllScenesNeutral.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.18ms |
| p50 | 0.20ms |
| p95 | 0.42ms |
| p99 | 0.49ms |
| mean | 0.23ms |
| stdev | 0.08ms |
| min | 0.17ms |
| max | 0.53ms |
| total | 9.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.18ms | 0.18ms | +0.00026ms | +0.15% |
| p50 | 0.20ms | 0.19ms | +0.0098ms | +5.24% |
| p95 | 0.42ms | 0.37ms | +0.05ms | +12.10% |
| p99 | 0.49ms | 0.42ms | +0.08ms | +18.87% |
| mean | 0.23ms | 0.20ms | +0.02ms | +11.92% |
| min | 0.17ms | 0.18ms | -0.0015ms | -0.88% |
| max | 0.53ms | 0.43ms | +0.11ms | +24.60% |
| total | 9.11ms | 8.14ms | +0.97ms | +11.92% |

### captureAllScenesChanged

# Perf Report — captureAllScenesChanged.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.19ms |
| p50 | 0.22ms |
| p95 | 0.26ms |
| p99 | 0.49ms |
| mean | 0.23ms |
| stdev | 0.06ms |
| min | 0.19ms |
| max | 0.49ms |
| total | 9.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.19ms | 0.18ms | +0.02ms | +9.22% |
| p50 | 0.22ms | 0.18ms | +0.04ms | +19.48% |
| p95 | 0.26ms | 0.23ms | +0.03ms | +15.00% |
| p99 | 0.49ms | 0.39ms | +0.10ms | +26.31% |
| mean | 0.23ms | 0.20ms | +0.04ms | +17.87% |
| min | 0.19ms | 0.17ms | +0.02ms | +10.26% |
| max | 0.49ms | 0.48ms | +0.01ms | +2.90% |
| total | 9.28ms | 7.87ms | +1.41ms | +17.87% |

### acceptAllPendingChanges

# Perf Report — acceptAllPendingChanges.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.19ms |
| p50 | 0.21ms |
| p95 | 0.63ms |
| p99 | 0.84ms |
| mean | 0.28ms |
| stdev | 0.17ms |
| min | 0.19ms |
| max | 0.90ms |
| total | 11.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.19ms | 0.19ms | +0.00066ms | +0.35% |
| p50 | 0.21ms | 0.20ms | +0.02ms | +9.66% |
| p95 | 0.63ms | 0.23ms | +0.41ms | +178.56% |
| p99 | 0.84ms | 0.46ms | +0.38ms | +81.57% |
| mean | 0.28ms | 0.21ms | +0.07ms | +35.90% |
| min | 0.19ms | 0.19ms | +0.00087ms | +0.47% |
| max | 0.90ms | 0.53ms | +0.38ms | +71.70% |
| total | 11.35ms | 8.35ms | +3.00ms | +35.90% |

