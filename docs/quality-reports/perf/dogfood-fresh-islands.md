# Perf Suite — dogfood-fresh-islands

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveRoute | 0.04ms | 0.10ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveIsland | 0.0066ms | 0.02ms | 80ms | 0.00033ms | PASS | stable (p10 +10% (閾値未満)、 p95 +66% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveHead | 0.0037ms | 0.010ms | 50ms | 0.00033ms | PASS | stable (p10 +20% (閾値未満)、 p95 +95% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveEdgeEnv | 0.01ms | 0.02ms | 100ms | 0.00033ms | PASS | stable (p10 -5% (閾値未満)、 p95 +23% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveRoute | 0.79ms | 160ms | PASS |
| driveIsland | 0.09ms | 160ms | PASS |
| driveHead | 0.19ms | 100ms | PASS |
| driveEdgeEnv | 0.25ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveRoute | -114464 B | 0 B | 102400 B | yes | PASS |
| driveIsland | -4008 B | 0 B | 102400 B | yes | PASS |
| driveHead | 1744 B | 0 B | 102400 B | yes | PASS |
| driveEdgeEnv | 10480 B | 2388 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveRoute

# Perf Report — driveRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.04ms |
| p50 | 0.05ms |
| p95 | 0.10ms |
| p99 | 0.29ms |
| mean | 0.06ms |
| stdev | 0.04ms |
| min | 0.04ms |
| max | 0.33ms |
| total | 11.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | +0.00039ms | +1.06% |
| p50 | 0.05ms | 0.05ms | -0.00042ms | -0.88% |
| p95 | 0.10ms | 0.09ms | +0.0098ms | +10.82% |
| p99 | 0.29ms | 0.16ms | +0.12ms | +75.05% |
| mean | 0.06ms | 0.05ms | +0.0035ms | +6.76% |
| min | 0.04ms | 0.03ms | +0.00087ms | +2.55% |
| max | 0.33ms | 0.24ms | +0.09ms | +38.36% |
| total | 11.20ms | 10.49ms | +0.71ms | +6.76% |

### driveIsland

# Perf Report — driveIsland.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0066ms |
| p50 | 0.0069ms |
| p95 | 0.02ms |
| p99 | 0.09ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.0065ms |
| max | 0.15ms |
| total | 2.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0066ms | 0.0060ms | +0.00063ms | +10.49% |
| p50 | 0.0069ms | 0.0067ms | +0.00017ms | +2.47% |
| p95 | 0.02ms | 0.01ms | +0.0098ms | +65.53% |
| p99 | 0.09ms | 0.03ms | +0.06ms | +250.88% |
| mean | 0.01ms | 0.0075ms | +0.0037ms | +49.07% |
| min | 0.0065ms | 0.0057ms | +0.00079ms | +13.96% |
| max | 0.15ms | 0.03ms | +0.12ms | +431.00% |
| total | 2.24ms | 1.50ms | +0.74ms | +49.07% |

### driveHead

# Perf Report — driveHead.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0037ms |
| p50 | 0.0039ms |
| p95 | 0.010ms |
| p99 | 0.05ms |
| mean | 0.0060ms |
| stdev | 0.0082ms |
| min | 0.0027ms |
| max | 0.08ms |
| total | 1.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0037ms | 0.0031ms | +0.00062ms | +20.00% |
| p50 | 0.0039ms | 0.0032ms | +0.00065ms | +19.86% |
| p95 | 0.010ms | 0.0051ms | +0.0049ms | +94.64% |
| p99 | 0.05ms | 0.01ms | +0.04ms | +274.28% |
| mean | 0.0060ms | 0.0039ms | +0.0022ms | +55.98% |
| min | 0.0027ms | 0.0030ms | -0.00029ms | -9.60% |
| max | 0.08ms | 0.02ms | +0.06ms | +306.46% |
| total | 1.20ms | 0.77ms | +0.43ms | +55.98% |

### driveEdgeEnv

# Perf Report — driveEdgeEnv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.08ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.31ms |
| total | 2.94ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00054ms | -4.99% |
| p50 | 0.01ms | 0.01ms | -0.00038ms | -3.35% |
| p95 | 0.02ms | 0.02ms | +0.0046ms | +22.80% |
| p99 | 0.08ms | 0.04ms | +0.04ms | +101.39% |
| mean | 0.01ms | 0.01ms | +0.0019ms | +14.84% |
| min | 0.01ms | 0.0098ms | +0.00025ms | +2.54% |
| max | 0.31ms | 0.07ms | +0.24ms | +362.66% |
| total | 2.94ms | 2.56ms | +0.38ms | +14.84% |

