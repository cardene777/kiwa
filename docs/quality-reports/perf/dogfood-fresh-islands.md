# Perf Suite — dogfood-fresh-islands

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveRoute | 0.04ms | 0.09ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveIsland | 0.0067ms | 0.01ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveHead | 0.0027ms | 0.0043ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveEdgeEnv | 0.01ms | 0.02ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveRoute | 0.82ms | 160ms | PASS |
| driveIsland | 0.10ms | 160ms | PASS |
| driveHead | 0.05ms | 100ms | PASS |
| driveEdgeEnv | 0.13ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveRoute | -209872 B | -23871 B | 102400 B | yes | PASS |
| driveIsland | -8856 B | 0 B | 102400 B | yes | PASS |
| driveHead | 472 B | 0 B | 102400 B | yes | PASS |
| driveEdgeEnv | 6680 B | 396 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveRoute

# Perf Report — driveRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.09ms |
| p99 | 0.27ms |
| mean | 0.05ms |
| stdev | 0.04ms |
| min | 0.03ms |
| max | 0.35ms |
| total | 10.77ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | +0.00027ms | +0.73% |
| p50 | 0.04ms | 0.05ms | -0.0034ms | -7.22% |
| p95 | 0.09ms | 0.09ms | +0.0020ms | +2.22% |
| p99 | 0.27ms | 0.16ms | +0.10ms | +63.92% |
| mean | 0.05ms | 0.05ms | +0.0014ms | +2.65% |
| min | 0.03ms | 0.03ms | -0.00054ms | -1.58% |
| max | 0.35ms | 0.24ms | +0.11ms | +46.76% |
| total | 10.77ms | 10.49ms | +0.28ms | +2.65% |

### driveIsland

# Perf Report — driveIsland.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0067ms |
| p50 | 0.0076ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0088ms |
| stdev | 0.0079ms |
| min | 0.0065ms |
| max | 0.11ms |
| total | 1.76ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0067ms | 0.0060ms | +0.00071ms | +11.90% |
| p50 | 0.0076ms | 0.0067ms | +0.00083ms | +12.35% |
| p95 | 0.01ms | 0.01ms | -0.0013ms | -8.40% |
| p99 | 0.03ms | 0.03ms | +0.0053ms | +21.01% |
| mean | 0.0088ms | 0.0075ms | +0.0013ms | +17.41% |
| min | 0.0065ms | 0.0057ms | +0.00083ms | +14.70% |
| max | 0.11ms | 0.03ms | +0.08ms | +278.25% |
| total | 1.76ms | 1.50ms | +0.26ms | +17.41% |

### driveHead

# Perf Report — driveHead.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0028ms |
| p95 | 0.0043ms |
| p99 | 0.01ms |
| mean | 0.0038ms |
| stdev | 0.0081ms |
| min | 0.0027ms |
| max | 0.12ms |
| total | 0.75ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0031ms | -0.00042ms | -13.34% |
| p50 | 0.0028ms | 0.0032ms | -0.00046ms | -14.12% |
| p95 | 0.0043ms | 0.0051ms | -0.00080ms | -15.53% |
| p99 | 0.01ms | 0.01ms | -0.00024ms | -1.83% |
| mean | 0.0038ms | 0.0039ms | -0.000086ms | -2.25% |
| min | 0.0027ms | 0.0030ms | -0.00038ms | -12.36% |
| max | 0.12ms | 0.02ms | +0.10ms | +479.73% |
| total | 0.75ms | 0.77ms | -0.02ms | -2.25% |

### driveEdgeEnv

# Perf Report — driveEdgeEnv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0094ms |
| min | 0.01ms |
| max | 0.14ms |
| total | 2.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.000046ms | -0.43% |
| p50 | 0.01ms | 0.01ms | -0.000084ms | -0.74% |
| p95 | 0.02ms | 0.02ms | -0.0051ms | -25.19% |
| p99 | 0.03ms | 0.04ms | -0.01ms | -29.64% |
| mean | 0.01ms | 0.01ms | -0.00050ms | -3.92% |
| min | 0.01ms | 0.0098ms | +0.00038ms | +3.82% |
| max | 0.14ms | 0.07ms | +0.08ms | +113.35% |
| total | 2.46ms | 2.56ms | -0.10ms | -3.92% |

