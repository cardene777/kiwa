# Perf Suite — dogfood-fresh-islands

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveRoute | 0.04ms | 0.12ms | 80ms | 0.00033ms | PASS | stable (p10 -3% (閾値未満)、 p95 +37% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveIsland | 0.0061ms | 0.02ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveHead | 0.0037ms | 0.0046ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveEdgeEnv | 0.01ms | 0.02ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveRoute | 0.52ms | 160ms | PASS |
| driveIsland | 0.13ms | 160ms | PASS |
| driveHead | 0.05ms | 100ms | PASS |
| driveEdgeEnv | 0.11ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveRoute | -117080 B | 0 B | 102400 B | yes | PASS |
| driveIsland | -3944 B | 0 B | 102400 B | yes | PASS |
| driveHead | 2784 B | 0 B | 102400 B | yes | PASS |
| driveEdgeEnv | -504 B | 1560 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveRoute

# Perf Report — driveRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.04ms |
| p50 | 0.05ms |
| p95 | 0.12ms |
| p99 | 0.31ms |
| mean | 0.06ms |
| stdev | 0.05ms |
| min | 0.03ms |
| max | 0.44ms |
| total | 11.70ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | -0.0012ms | -3.11% |
| p50 | 0.05ms | 0.05ms | -0.0019ms | -4.12% |
| p95 | 0.12ms | 0.09ms | +0.03ms | +36.61% |
| p99 | 0.31ms | 0.16ms | +0.15ms | +92.26% |
| mean | 0.06ms | 0.05ms | +0.0060ms | +11.45% |
| min | 0.03ms | 0.03ms | +0.00071ms | +2.07% |
| max | 0.44ms | 0.24ms | +0.21ms | +86.36% |
| total | 11.70ms | 10.49ms | +1.20ms | +11.45% |

### driveIsland

# Perf Report — driveIsland.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0061ms |
| p50 | 0.0070ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0083ms |
| stdev | 0.0087ms |
| min | 0.0060ms |
| max | 0.12ms |
| total | 1.67ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0061ms | 0.0060ms | +0.00017ms | +2.80% |
| p50 | 0.0070ms | 0.0067ms | +0.00021ms | +3.08% |
| p95 | 0.02ms | 0.01ms | +0.00051ms | +3.43% |
| p99 | 0.03ms | 0.03ms | +0.0017ms | +6.71% |
| mean | 0.0083ms | 0.0075ms | +0.00083ms | +11.01% |
| min | 0.0060ms | 0.0057ms | +0.00029ms | +5.13% |
| max | 0.12ms | 0.03ms | +0.09ms | +331.15% |
| total | 1.67ms | 1.50ms | +0.17ms | +11.01% |

### driveHead

# Perf Report — driveHead.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0037ms |
| p50 | 0.0037ms |
| p95 | 0.0046ms |
| p99 | 0.01ms |
| mean | 0.0041ms |
| stdev | 0.0016ms |
| min | 0.0035ms |
| max | 0.02ms |
| total | 0.81ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0037ms | 0.0031ms | +0.00054ms | +17.31% |
| p50 | 0.0037ms | 0.0032ms | +0.00050ms | +15.38% |
| p95 | 0.0046ms | 0.0051ms | -0.00049ms | -9.60% |
| p99 | 0.01ms | 0.01ms | -0.0029ms | -21.52% |
| mean | 0.0041ms | 0.0039ms | +0.00021ms | +5.57% |
| min | 0.0035ms | 0.0030ms | +0.00050ms | +16.44% |
| max | 0.02ms | 0.02ms | -0.0010ms | -5.23% |
| total | 0.81ms | 0.77ms | +0.04ms | +5.57% |

### driveEdgeEnv

# Perf Report — driveEdgeEnv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.01ms |
| stdev | 0.0087ms |
| min | 0.01ms |
| max | 0.12ms |
| total | 2.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00033ms | -3.07% |
| p50 | 0.01ms | 0.01ms | -0.00033ms | -2.98% |
| p95 | 0.02ms | 0.02ms | -0.0038ms | -19.03% |
| p99 | 0.04ms | 0.04ms | +0.00062ms | +1.61% |
| mean | 0.01ms | 0.01ms | -0.00045ms | -3.53% |
| min | 0.01ms | 0.0098ms | +0.00054ms | +5.51% |
| max | 0.12ms | 0.07ms | +0.06ms | +88.29% |
| total | 2.47ms | 2.56ms | -0.09ms | -3.53% |

