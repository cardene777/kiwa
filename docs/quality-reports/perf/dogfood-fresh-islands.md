# Perf Suite — dogfood-fresh-islands

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveRoute | 0.04ms | 0.11ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveIsland | 0.0058ms | 0.01ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveHead | 0.0027ms | 0.0074ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveEdgeEnv | 0.0097ms | 0.03ms | 100ms | 0.00033ms | PASS | stable (p10 +2% (閾値未満)、 p95 +94% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| driveRoute | cpu | 0.08ms | 0.04ms | 0.439 | 0.396 | 0.04ms | 0.03ms |
| driveIsland | cpu | 0.08ms | 0.0058ms | 0.072 | 0.071 | 0.0057ms | 0.0057ms |
| driveHead | cpu | 0.08ms | 0.0027ms | 0.033 | 0.034 | 0.0026ms | 0.0027ms |
| driveEdgeEnv | cpu | 0.08ms | 0.0097ms | 0.120 | 0.118 | 0.0096ms | 0.0094ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveRoute | 0.45ms | 160ms | PASS |
| driveIsland | 0.08ms | 160ms | PASS |
| driveHead | 0.05ms | 100ms | PASS |
| driveEdgeEnv | 0.11ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveRoute | -203640 B | 0 B | 102400 B | yes | PASS |
| driveIsland | 920 B | 0 B | 102400 B | yes | PASS |
| driveHead | -7528 B | 0 B | 102400 B | yes | PASS |
| driveEdgeEnv | -13872 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveRoute

# Perf Report — driveRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.11ms |
| p99 | 0.16ms |
| mean | 0.05ms |
| stdev | 0.03ms |
| min | 0.03ms |
| max | 0.23ms |
| total | 10.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.03ms | +0.0033ms | +10.19% |
| p50 | 0.04ms | 0.04ms | -0.00058ms | -1.39% |
| p95 | 0.11ms | 0.11ms | -0.0071ms | -6.35% |
| p99 | 0.16ms | 0.16ms | -0.0055ms | -3.42% |
| mean | 0.05ms | 0.05ms | -0.0015ms | -2.92% |
| min | 0.03ms | 0.03ms | +0.0013ms | +4.39% |
| max | 0.23ms | 0.38ms | -0.16ms | -40.85% |
| total | 10.09ms | 10.39ms | -0.30ms | -2.92% |

### driveIsland

# Perf Report — driveIsland.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0058ms |
| p50 | 0.0062ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0079ms |
| stdev | 0.01ms |
| min | 0.0057ms |
| max | 0.13ms |
| total | 1.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0058ms | 0.0057ms | +0.00012ms | +2.19% |
| p50 | 0.0062ms | 0.0062ms | -0.000022ms | -0.35% |
| p95 | 0.01ms | 0.01ms | -0.0013ms | -8.93% |
| p99 | 0.03ms | 0.03ms | +0.0040ms | +13.59% |
| mean | 0.0079ms | 0.0072ms | +0.00073ms | +10.14% |
| min | 0.0057ms | 0.0056ms | +0.000084ms | +1.50% |
| max | 0.13ms | 0.05ms | +0.09ms | +181.37% |
| total | 1.59ms | 1.44ms | +0.15ms | +10.14% |

### driveHead

# Perf Report — driveHead.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0029ms |
| p95 | 0.0074ms |
| p99 | 0.02ms |
| mean | 0.0039ms |
| stdev | 0.0050ms |
| min | 0.0026ms |
| max | 0.05ms |
| total | 0.78ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0027ms | -0.000041ms | -1.51% |
| p50 | 0.0029ms | 0.0028ms | +0.000083ms | +2.97% |
| p95 | 0.0074ms | 0.0074ms | +0.000053ms | +0.72% |
| p99 | 0.02ms | 0.03ms | -0.0051ms | -17.42% |
| mean | 0.0039ms | 0.0039ms | +0.000019ms | +0.49% |
| min | 0.0026ms | 0.0026ms | 0.00ms | 0.00% |
| max | 0.05ms | 0.05ms | -0.0024ms | -4.78% |
| total | 0.78ms | 0.78ms | +0.0038ms | +0.49% |

### driveEdgeEnv

# Perf Report — driveEdgeEnv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0097ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.11ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.0094ms |
| max | 0.15ms |
| total | 2.84ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0097ms | 0.0094ms | +0.00025ms | +2.67% |
| p50 | 0.01ms | 0.0098ms | +0.00092ms | +9.37% |
| p95 | 0.03ms | 0.01ms | +0.01ms | +96.03% |
| p99 | 0.11ms | 0.02ms | +0.09ms | +384.16% |
| mean | 0.01ms | 0.01ms | +0.0036ms | +33.96% |
| min | 0.0094ms | 0.0091ms | +0.00033ms | +3.68% |
| max | 0.15ms | 0.06ms | +0.09ms | +140.56% |
| total | 2.84ms | 2.12ms | +0.72ms | +33.96% |

