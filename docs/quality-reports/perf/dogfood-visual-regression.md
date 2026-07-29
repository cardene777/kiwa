# Perf Suite — dogfood-visual-regression

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| seedAllBaselines | 0.09ms | 0.16ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureAllScenesNeutral | 0.17ms | 0.34ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureAllScenesChanged | 0.17ms | 0.28ms | 80ms | 0.00033ms | PASS | stable (p10 -4% (閾値未満)、 p95 +21% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| acceptAllPendingChanges | 0.19ms | 0.33ms | 80ms | 0.00033ms | PASS | stable (p10 +3% (閾値未満)、 p95 +46% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| seedAllBaselines | 1.11ms | 100ms | PASS |
| captureAllScenesNeutral | 2.42ms | 160ms | PASS |
| captureAllScenesChanged | 2.19ms | 160ms | PASS |
| acceptAllPendingChanges | 2.23ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| seedAllBaselines | 1984 B | 0 B | 102400 B | yes | PASS |
| captureAllScenesNeutral | -48168 B | 0 B | 102400 B | yes | PASS |
| captureAllScenesChanged | 5104 B | 0 B | 102400 B | yes | PASS |
| acceptAllPendingChanges | 46152 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### seedAllBaselines

# Perf Report — seedAllBaselines.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.09ms |
| p50 | 0.11ms |
| p95 | 0.16ms |
| p99 | 0.33ms |
| mean | 0.12ms |
| stdev | 0.06ms |
| min | 0.07ms |
| max | 0.43ms |
| total | 4.79ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.09ms | 0.09ms | -0.0028ms | -3.08% |
| p50 | 0.11ms | 0.11ms | +0.00033ms | +0.31% |
| p95 | 0.16ms | 0.16ms | +0.00098ms | +0.61% |
| p99 | 0.33ms | 0.34ms | -0.0020ms | -0.59% |
| mean | 0.12ms | 0.12ms | -0.00071ms | -0.59% |
| min | 0.07ms | 0.08ms | -0.0032ms | -4.13% |
| max | 0.43ms | 0.45ms | -0.02ms | -4.22% |
| total | 4.79ms | 4.81ms | -0.03ms | -0.59% |

### captureAllScenesNeutral

# Perf Report — captureAllScenesNeutral.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.17ms |
| p50 | 0.18ms |
| p95 | 0.34ms |
| p99 | 0.39ms |
| mean | 0.20ms |
| stdev | 0.06ms |
| min | 0.17ms |
| max | 0.40ms |
| total | 8.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.17ms | 0.18ms | -0.0045ms | -2.53% |
| p50 | 0.18ms | 0.19ms | -0.0053ms | -2.85% |
| p95 | 0.34ms | 0.37ms | -0.04ms | -9.57% |
| p99 | 0.39ms | 0.42ms | -0.02ms | -5.64% |
| mean | 0.20ms | 0.20ms | +0.0014ms | +0.70% |
| min | 0.17ms | 0.18ms | -0.0070ms | -3.98% |
| max | 0.40ms | 0.43ms | -0.03ms | -6.33% |
| total | 8.20ms | 8.14ms | +0.06ms | +0.70% |

### captureAllScenesChanged

# Perf Report — captureAllScenesChanged.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.17ms |
| p50 | 0.18ms |
| p95 | 0.28ms |
| p99 | 0.38ms |
| mean | 0.19ms |
| stdev | 0.05ms |
| min | 0.17ms |
| max | 0.44ms |
| total | 7.71ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.17ms | 0.18ms | -0.0079ms | -4.49% |
| p50 | 0.18ms | 0.18ms | -0.0065ms | -3.54% |
| p95 | 0.28ms | 0.23ms | +0.05ms | +21.40% |
| p99 | 0.38ms | 0.39ms | -0.0064ms | -1.65% |
| mean | 0.19ms | 0.20ms | -0.0040ms | -2.02% |
| min | 0.17ms | 0.17ms | -0.0039ms | -2.27% |
| max | 0.44ms | 0.48ms | -0.04ms | -7.79% |
| total | 7.71ms | 7.87ms | -0.16ms | -2.02% |

### acceptAllPendingChanges

# Perf Report — acceptAllPendingChanges.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.19ms |
| p50 | 0.23ms |
| p95 | 0.33ms |
| p99 | 0.48ms |
| mean | 0.24ms |
| stdev | 0.06ms |
| min | 0.19ms |
| max | 0.49ms |
| total | 9.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.19ms | 0.19ms | +0.0056ms | +2.99% |
| p50 | 0.23ms | 0.20ms | +0.04ms | +19.07% |
| p95 | 0.33ms | 0.23ms | +0.10ms | +45.93% |
| p99 | 0.48ms | 0.46ms | +0.02ms | +3.57% |
| mean | 0.24ms | 0.21ms | +0.03ms | +15.67% |
| min | 0.19ms | 0.19ms | +0.0010ms | +0.54% |
| max | 0.49ms | 0.53ms | -0.04ms | -6.80% |
| total | 9.66ms | 8.35ms | +1.31ms | +15.67% |

