# Perf Suite — dogfood-fresh-islands

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveRoute | 0.03ms | 0.15ms | 80ms | 0.00033ms | PASS | stable (p10 -10% (閾値未満)、 p95 +63% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveIsland | 0.0060ms | 0.01ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveHead | 0.0027ms | 0.0047ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveEdgeEnv | 0.0097ms | 0.01ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveRoute | 1.09ms | 160ms | PASS |
| driveIsland | 0.08ms | 160ms | PASS |
| driveHead | 0.05ms | 100ms | PASS |
| driveEdgeEnv | 0.10ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveRoute | -114568 B | 0 B | 102400 B | yes | PASS |
| driveIsland | -3112 B | 0 B | 102400 B | yes | PASS |
| driveHead | -672 B | 0 B | 102400 B | yes | PASS |
| driveEdgeEnv | 8952 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveRoute

# Perf Report — driveRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.15ms |
| p99 | 0.25ms |
| mean | 0.06ms |
| stdev | 0.05ms |
| min | 0.03ms |
| max | 0.47ms |
| total | 11.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.0037ms | -10.12% |
| p50 | 0.04ms | 0.05ms | -0.0069ms | -14.56% |
| p95 | 0.15ms | 0.09ms | +0.06ms | +63.07% |
| p99 | 0.25ms | 0.16ms | +0.08ms | +50.82% |
| mean | 0.06ms | 0.05ms | +0.0035ms | +6.75% |
| min | 0.03ms | 0.03ms | -0.0039ms | -11.33% |
| max | 0.47ms | 0.24ms | +0.23ms | +95.04% |
| total | 11.20ms | 10.49ms | +0.71ms | +6.75% |

### driveIsland

# Perf Report — driveIsland.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0060ms |
| p50 | 0.0066ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0080ms |
| stdev | 0.0099ms |
| min | 0.0057ms |
| max | 0.14ms |
| total | 1.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0060ms | 0.0060ms | +0.000042ms | +0.70% |
| p50 | 0.0066ms | 0.0067ms | -0.00017ms | -2.47% |
| p95 | 0.01ms | 0.01ms | -0.0017ms | -11.08% |
| p99 | 0.03ms | 0.03ms | +0.0044ms | +17.59% |
| mean | 0.0080ms | 0.0075ms | +0.00050ms | +6.65% |
| min | 0.0057ms | 0.0057ms | 0.00ms | 0.00% |
| max | 0.14ms | 0.03ms | +0.11ms | +395.39% |
| total | 1.60ms | 1.50ms | +0.10ms | +6.65% |

### driveHead

# Perf Report — driveHead.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0028ms |
| p95 | 0.0047ms |
| p99 | 0.01ms |
| mean | 0.0033ms |
| stdev | 0.0018ms |
| min | 0.0026ms |
| max | 0.02ms |
| total | 0.65ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0031ms | -0.00042ms | -13.34% |
| p50 | 0.0028ms | 0.0032ms | -0.00046ms | -14.09% |
| p95 | 0.0047ms | 0.0051ms | -0.00041ms | -7.89% |
| p99 | 0.01ms | 0.01ms | -0.0019ms | -14.44% |
| mean | 0.0033ms | 0.0039ms | -0.00060ms | -15.51% |
| min | 0.0026ms | 0.0030ms | -0.00042ms | -13.71% |
| max | 0.02ms | 0.02ms | -0.0019ms | -9.40% |
| total | 0.65ms | 0.77ms | -0.12ms | -15.51% |

### driveEdgeEnv

# Perf Report — driveEdgeEnv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0097ms |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0078ms |
| min | 0.0095ms |
| max | 0.11ms |
| total | 2.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0097ms | 0.01ms | -0.0011ms | -10.00% |
| p50 | 0.01ms | 0.01ms | -0.0012ms | -10.60% |
| p95 | 0.01ms | 0.02ms | -0.0063ms | -30.98% |
| p99 | 0.03ms | 0.04ms | -0.01ms | -32.44% |
| mean | 0.01ms | 0.01ms | -0.0017ms | -13.01% |
| min | 0.0095ms | 0.0098ms | -0.00029ms | -2.96% |
| max | 0.11ms | 0.07ms | +0.05ms | +72.04% |
| total | 2.22ms | 2.56ms | -0.33ms | -13.01% |

