# Perf Suite — dogfood-fresh-islands

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveRoute | 0.03ms | 0.09ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveIsland | 0.0057ms | 0.02ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveHead | 0.0027ms | 0.0040ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveEdgeEnv | 0.0098ms | 0.02ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveRoute | 0.38ms | 160ms | PASS |
| driveIsland | 0.08ms | 160ms | PASS |
| driveHead | 0.04ms | 100ms | PASS |
| driveEdgeEnv | 0.11ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveRoute | -117256 B | 0 B | 102400 B | yes | PASS |
| driveIsland | 856 B | 0 B | 102400 B | yes | PASS |
| driveHead | -9048 B | 0 B | 102400 B | yes | PASS |
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
| p99 | 0.15ms |
| mean | 0.05ms |
| stdev | 0.03ms |
| min | 0.03ms |
| max | 0.32ms |
| total | 9.90ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.0028ms | -7.49% |
| p50 | 0.04ms | 0.05ms | -0.0061ms | -12.93% |
| p95 | 0.09ms | 0.09ms | +0.00035ms | +0.39% |
| p99 | 0.15ms | 0.16ms | -0.01ms | -6.30% |
| mean | 0.05ms | 0.05ms | -0.0030ms | -5.64% |
| min | 0.03ms | 0.03ms | -0.0032ms | -9.38% |
| max | 0.32ms | 0.24ms | +0.08ms | +34.88% |
| total | 9.90ms | 10.49ms | -0.59ms | -5.64% |

### driveIsland

# Perf Report — driveIsland.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0057ms |
| p50 | 0.0064ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0076ms |
| stdev | 0.0071ms |
| min | 0.0055ms |
| max | 0.10ms |
| total | 1.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0057ms | 0.0060ms | -0.00025ms | -4.20% |
| p50 | 0.0064ms | 0.0067ms | -0.00038ms | -5.56% |
| p95 | 0.02ms | 0.01ms | +0.00043ms | +2.91% |
| p99 | 0.03ms | 0.03ms | +0.00037ms | +1.48% |
| mean | 0.0076ms | 0.0075ms | +0.00011ms | +1.42% |
| min | 0.0055ms | 0.0057ms | -0.00013ms | -2.21% |
| max | 0.10ms | 0.03ms | +0.07ms | +245.01% |
| total | 1.52ms | 1.50ms | +0.02ms | +1.42% |

### driveHead

# Perf Report — driveHead.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0027ms |
| p95 | 0.0040ms |
| p99 | 0.01ms |
| mean | 0.0032ms |
| stdev | 0.0015ms |
| min | 0.0027ms |
| max | 0.02ms |
| total | 0.63ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0031ms | -0.00042ms | -13.34% |
| p50 | 0.0027ms | 0.0032ms | -0.00050ms | -15.38% |
| p95 | 0.0040ms | 0.0051ms | -0.0012ms | -22.56% |
| p99 | 0.01ms | 0.01ms | -0.0032ms | -24.25% |
| mean | 0.0032ms | 0.0039ms | -0.00070ms | -18.07% |
| min | 0.0027ms | 0.0030ms | -0.00038ms | -12.36% |
| max | 0.02ms | 0.02ms | -0.0022ms | -11.07% |
| total | 0.63ms | 0.77ms | -0.14ms | -18.07% |

### driveEdgeEnv

# Perf Report — driveEdgeEnv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0098ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0069ms |
| min | 0.0096ms |
| max | 0.10ms |
| total | 2.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0098ms | 0.01ms | -0.0010ms | -9.27% |
| p50 | 0.01ms | 0.01ms | -0.0011ms | -9.48% |
| p95 | 0.02ms | 0.02ms | -0.0049ms | -24.11% |
| p99 | 0.03ms | 0.04ms | -0.01ms | -28.63% |
| mean | 0.01ms | 0.01ms | -0.0015ms | -11.60% |
| min | 0.0096ms | 0.0098ms | -0.00025ms | -2.54% |
| max | 0.10ms | 0.07ms | +0.04ms | +53.53% |
| total | 2.26ms | 2.56ms | -0.30ms | -11.60% |

