# Perf Suite — dogfood-fresh-islands

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveRoute | 0.03ms | 0.09ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveIsland | 0.0058ms | 0.02ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveHead | 0.0027ms | 0.0046ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveEdgeEnv | 0.0095ms | 0.01ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveRoute | 0.44ms | 160ms | PASS |
| driveIsland | 0.10ms | 160ms | PASS |
| driveHead | 0.04ms | 100ms | PASS |
| driveEdgeEnv | 0.11ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveRoute | -117040 B | 0 B | 102400 B | yes | PASS |
| driveIsland | 856 B | 0 B | 102400 B | yes | PASS |
| driveHead | -8008 B | 0 B | 102400 B | yes | PASS |
| driveEdgeEnv | -11256 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveRoute

# Perf Report — driveRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.09ms |
| p99 | 0.17ms |
| mean | 0.05ms |
| stdev | 0.03ms |
| min | 0.03ms |
| max | 0.29ms |
| total | 9.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.0039ms | -10.65% |
| p50 | 0.04ms | 0.05ms | -0.0068ms | -14.43% |
| p95 | 0.09ms | 0.09ms | -0.0046ms | -5.06% |
| p99 | 0.17ms | 0.16ms | +0.01ms | +6.69% |
| mean | 0.05ms | 0.05ms | -0.0050ms | -9.44% |
| min | 0.03ms | 0.03ms | -0.0022ms | -6.33% |
| max | 0.29ms | 0.24ms | +0.05ms | +21.01% |
| total | 9.50ms | 10.49ms | -0.99ms | -9.44% |

### driveIsland

# Perf Report — driveIsland.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0058ms |
| p50 | 0.0065ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0079ms |
| stdev | 0.0078ms |
| min | 0.0057ms |
| max | 0.10ms |
| total | 1.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0058ms | 0.0060ms | -0.00017ms | -2.79% |
| p50 | 0.0065ms | 0.0067ms | -0.00029ms | -4.33% |
| p95 | 0.02ms | 0.01ms | +0.0014ms | +9.25% |
| p99 | 0.03ms | 0.03ms | +0.0027ms | +10.65% |
| mean | 0.0079ms | 0.0075ms | +0.00036ms | +4.77% |
| min | 0.0057ms | 0.0057ms | -0.0000010ms | -0.02% |
| max | 0.10ms | 0.03ms | +0.08ms | +275.42% |
| total | 1.57ms | 1.50ms | +0.07ms | +4.77% |

### driveHead

# Perf Report — driveHead.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0028ms |
| p95 | 0.0046ms |
| p99 | 0.01ms |
| mean | 0.0033ms |
| stdev | 0.0017ms |
| min | 0.0027ms |
| max | 0.02ms |
| total | 0.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0031ms | -0.00038ms | -12.00% |
| p50 | 0.0028ms | 0.0032ms | -0.00042ms | -12.80% |
| p95 | 0.0046ms | 0.0051ms | -0.00058ms | -11.26% |
| p99 | 0.01ms | 0.01ms | -0.0024ms | -18.12% |
| mean | 0.0033ms | 0.0039ms | -0.00056ms | -14.44% |
| min | 0.0027ms | 0.0030ms | -0.00037ms | -12.33% |
| max | 0.02ms | 0.02ms | -0.0017ms | -8.56% |
| total | 0.66ms | 0.77ms | -0.11ms | -14.44% |

### driveEdgeEnv

# Perf Report — driveEdgeEnv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0095ms |
| p50 | 0.0097ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0071ms |
| min | 0.0092ms |
| max | 0.10ms |
| total | 2.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0095ms | 0.01ms | -0.0014ms | -12.68% |
| p50 | 0.0097ms | 0.01ms | -0.0015ms | -13.01% |
| p95 | 0.01ms | 0.02ms | -0.0064ms | -31.54% |
| p99 | 0.02ms | 0.04ms | -0.01ms | -37.46% |
| mean | 0.01ms | 0.01ms | -0.0020ms | -15.48% |
| min | 0.0092ms | 0.0098ms | -0.00063ms | -6.36% |
| max | 0.10ms | 0.07ms | +0.04ms | +58.50% |
| total | 2.16ms | 2.56ms | -0.40ms | -15.48% |

