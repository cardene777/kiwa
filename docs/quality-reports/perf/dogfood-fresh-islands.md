# Perf Suite — dogfood-fresh-islands

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveRoute | 0.03ms | 0.08ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveIsland | 0.0059ms | 0.02ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveHead | 0.0027ms | 0.0046ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveEdgeEnv | 0.01ms | 0.02ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveRoute | 0.40ms | 160ms | PASS |
| driveIsland | 0.08ms | 160ms | PASS |
| driveHead | 0.04ms | 100ms | PASS |
| driveEdgeEnv | 0.12ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveRoute | -117256 B | 0 B | 102400 B | yes | PASS |
| driveIsland | 920 B | 0 B | 102400 B | yes | PASS |
| driveHead | -576 B | 0 B | 102400 B | yes | PASS |
| driveEdgeEnv | 10272 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveRoute

# Perf Report — driveRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.08ms |
| p99 | 0.14ms |
| mean | 0.05ms |
| stdev | 0.03ms |
| min | 0.03ms |
| max | 0.34ms |
| total | 9.43ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.0033ms | -8.99% |
| p50 | 0.04ms | 0.05ms | -0.0069ms | -14.56% |
| p95 | 0.08ms | 0.09ms | -0.0089ms | -9.92% |
| p99 | 0.14ms | 0.16ms | -0.03ms | -15.92% |
| mean | 0.05ms | 0.05ms | -0.0053ms | -10.14% |
| min | 0.03ms | 0.03ms | -0.0033ms | -9.62% |
| max | 0.34ms | 0.24ms | +0.11ms | +44.42% |
| total | 9.43ms | 10.49ms | -1.06ms | -10.14% |

### driveIsland

# Perf Report — driveIsland.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0059ms |
| p50 | 0.0067ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0087ms |
| stdev | 0.02ms |
| min | 0.0057ms |
| max | 0.22ms |
| total | 1.74ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0059ms | 0.0060ms | -0.000083ms | -1.39% |
| p50 | 0.0067ms | 0.0067ms | -0.000083ms | -1.23% |
| p95 | 0.02ms | 0.01ms | +0.0020ms | +13.42% |
| p99 | 0.03ms | 0.03ms | +0.0024ms | +9.62% |
| mean | 0.0087ms | 0.0075ms | +0.0012ms | +15.63% |
| min | 0.0057ms | 0.0057ms | -0.0000010ms | -0.02% |
| max | 0.22ms | 0.03ms | +0.19ms | +692.56% |
| total | 1.74ms | 1.50ms | +0.23ms | +15.63% |

### driveHead

# Perf Report — driveHead.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0029ms |
| p95 | 0.0046ms |
| p99 | 0.01ms |
| mean | 0.0033ms |
| stdev | 0.0015ms |
| min | 0.0027ms |
| max | 0.02ms |
| total | 0.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0031ms | -0.00038ms | -12.00% |
| p50 | 0.0029ms | 0.0032ms | -0.00037ms | -11.54% |
| p95 | 0.0046ms | 0.0051ms | -0.00054ms | -10.56% |
| p99 | 0.01ms | 0.01ms | -0.0034ms | -25.17% |
| mean | 0.0033ms | 0.0039ms | -0.00057ms | -14.90% |
| min | 0.0027ms | 0.0030ms | -0.00038ms | -12.36% |
| max | 0.02ms | 0.02ms | -0.0023ms | -11.48% |
| total | 0.66ms | 0.77ms | -0.11ms | -14.90% |

### driveEdgeEnv

# Perf Report — driveEdgeEnv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.15ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.22ms |
| total | 2.96ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00046ms | -4.23% |
| p50 | 0.01ms | 0.01ms | -0.00042ms | -3.72% |
| p95 | 0.02ms | 0.02ms | +0.0037ms | +18.53% |
| p99 | 0.15ms | 0.04ms | +0.12ms | +301.67% |
| mean | 0.01ms | 0.01ms | +0.0020ms | +15.95% |
| min | 0.01ms | 0.0098ms | +0.00033ms | +3.39% |
| max | 0.22ms | 0.07ms | +0.15ms | +230.17% |
| total | 2.96ms | 2.56ms | +0.41ms | +15.95% |

