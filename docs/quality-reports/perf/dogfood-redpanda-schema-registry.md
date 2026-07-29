# Perf Suite — dogfood-redpanda-schema-registry

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveRegister | 0.0072ms | 0.03ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveEvolution | 0.01ms | 0.03ms | 80ms | 0.00032ms | PASS | stable (p10 +5% (閾値未満)、 p95 +55% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveCompatibilityModes | 0.0093ms | 0.02ms | 80ms | 0.00029ms | PASS | stable (p10 -3% (閾値未満)、 p95 +44% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| drivePublish | 0.01ms | 0.03ms | 80ms | 0.00033ms | PASS | stable (p10 +5% (閾値未満)、 p95 +36% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| driveRegister | cpu | 0.08ms | 0.0072ms | 0.087 | 0.094 | 0.0072ms | 0.0077ms |
| driveEvolution | cpu | 0.09ms | 0.01ms | 0.127 | 0.121 | 0.01ms | 0.01ms |
| driveCompatibilityModes | cpu | 0.09ms | 0.0093ms | 0.100 | 0.103 | 0.0081ms | 0.0083ms |
| drivePublish | cpu | 0.08ms | 0.01ms | 0.163 | 0.156 | 0.01ms | 0.01ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveRegister | 0.26ms | 160ms | PASS |
| driveEvolution | 0.21ms | 160ms | PASS |
| driveCompatibilityModes | 0.13ms | 160ms | PASS |
| drivePublish | 0.17ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveRegister | 4336 B | 0 B | 102400 B | yes | PASS |
| driveEvolution | -9136 B | 0 B | 102400 B | yes | PASS |
| driveCompatibilityModes | 2304 B | 0 B | 102400 B | yes | PASS |
| drivePublish | -2336 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveRegister

# Perf Report — driveRegister.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0072ms |
| p50 | 0.0080ms |
| p95 | 0.03ms |
| p99 | 0.06ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0068ms |
| max | 0.10ms |
| total | 2.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0072ms | 0.0077ms | -0.00058ms | -7.47% |
| p50 | 0.0080ms | 0.0086ms | -0.00054ms | -6.31% |
| p95 | 0.03ms | 0.03ms | +0.0018ms | +5.89% |
| p99 | 0.06ms | 0.06ms | -0.0015ms | -2.55% |
| mean | 0.01ms | 0.01ms | -0.00068ms | -5.73% |
| min | 0.0068ms | 0.0073ms | -0.00054ms | -7.39% |
| max | 0.10ms | 0.07ms | +0.04ms | +58.72% |
| total | 2.25ms | 2.38ms | -0.14ms | -5.73% |

### driveEvolution

# Perf Report — driveEvolution.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.12ms |
| total | 2.94ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00091ms | +9.12% |
| p50 | 0.01ms | 0.01ms | +0.0011ms | +10.14% |
| p95 | 0.03ms | 0.02ms | +0.01ms | +61.49% |
| p99 | 0.04ms | 0.06ms | -0.02ms | -30.04% |
| mean | 0.01ms | 0.01ms | +0.0022ms | +17.35% |
| min | 0.01ms | 0.0097ms | +0.00067ms | +6.84% |
| max | 0.12ms | 0.09ms | +0.03ms | +32.06% |
| total | 2.94ms | 2.51ms | +0.44ms | +17.35% |

### driveCompatibilityModes

# Perf Report — driveCompatibilityModes.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0093ms |
| p50 | 0.0098ms |
| p95 | 0.02ms |
| p99 | 0.05ms |
| mean | 0.01ms |
| stdev | 0.0082ms |
| min | 0.0092ms |
| max | 0.09ms |
| total | 2.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0093ms | 0.0083ms | +0.0010ms | +12.01% |
| p50 | 0.0098ms | 0.0085ms | +0.0013ms | +15.13% |
| p95 | 0.02ms | 0.01ms | +0.0067ms | +66.42% |
| p99 | 0.05ms | 0.02ms | +0.03ms | +221.24% |
| mean | 0.01ms | 0.0089ms | +0.0028ms | +31.33% |
| min | 0.0092ms | 0.0081ms | +0.0011ms | +13.92% |
| max | 0.09ms | 0.03ms | +0.06ms | +165.45% |
| total | 2.34ms | 1.78ms | +0.56ms | +31.33% |

### drivePublish

# Perf Report — drivePublish.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.07ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.12ms |
| total | 3.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00061ms | +4.74% |
| p50 | 0.01ms | 0.01ms | +0.0010ms | +7.63% |
| p95 | 0.03ms | 0.02ms | +0.0082ms | +36.03% |
| p99 | 0.07ms | 0.05ms | +0.02ms | +39.36% |
| mean | 0.02ms | 0.01ms | +0.0020ms | +13.30% |
| min | 0.01ms | 0.01ms | +0.00017ms | +1.31% |
| max | 0.12ms | 0.07ms | +0.05ms | +75.73% |
| total | 3.39ms | 2.99ms | +0.40ms | +13.30% |

