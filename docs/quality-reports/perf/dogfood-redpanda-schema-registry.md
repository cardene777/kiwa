# Perf Suite — dogfood-redpanda-schema-registry

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveRegister | 0.0072ms | 0.02ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveEvolution | 0.01ms | 0.02ms | 80ms | 0.00033ms | PASS | stable (p10 +0% (閾値未満)、 p95 +37% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveCompatibilityModes | 0.0085ms | 0.01ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| drivePublish | 0.01ms | 0.02ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveRegister | 0.11ms | 160ms | PASS |
| driveEvolution | 0.16ms | 160ms | PASS |
| driveCompatibilityModes | 0.10ms | 160ms | PASS |
| drivePublish | 0.17ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveRegister | -3256 B | 0 B | 102400 B | yes | PASS |
| driveEvolution | -9168 B | 0 B | 102400 B | yes | PASS |
| driveCompatibilityModes | 2128 B | 0 B | 102400 B | yes | PASS |
| drivePublish | -2368 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveRegister

# Perf Report — driveRegister.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0072ms |
| p50 | 0.0075ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.0093ms |
| stdev | 0.0079ms |
| min | 0.0068ms |
| max | 0.10ms |
| total | 1.86ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0072ms | 0.0066ms | +0.00055ms | +8.23% |
| p50 | 0.0075ms | 0.0075ms | -0.000062ms | -0.82% |
| p95 | 0.02ms | 0.01ms | +0.0022ms | +15.79% |
| p99 | 0.04ms | 0.05ms | -0.01ms | -26.26% |
| mean | 0.0093ms | 0.0091ms | +0.00018ms | +1.99% |
| min | 0.0068ms | 0.0063ms | +0.00046ms | +7.25% |
| max | 0.10ms | 0.07ms | +0.03ms | +36.57% |
| total | 1.86ms | 1.83ms | +0.04ms | +1.99% |

### driveEvolution

# Perf Report — driveEvolution.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0098ms |
| max | 0.15ms |
| total | 2.41ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.000042ms | +0.42% |
| p50 | 0.01ms | 0.01ms | -0.0000010ms | -0.01% |
| p95 | 0.02ms | 0.01ms | +0.0053ms | +37.29% |
| p99 | 0.03ms | 0.02ms | +0.0072ms | +34.99% |
| mean | 0.01ms | 0.01ms | +0.0011ms | +9.74% |
| min | 0.0098ms | 0.0099ms | -0.000083ms | -0.84% |
| max | 0.15ms | 0.02ms | +0.13ms | +543.24% |
| total | 2.41ms | 2.19ms | +0.21ms | +9.74% |

### driveCompatibilityModes

# Perf Report — driveCompatibilityModes.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0085ms |
| p50 | 0.0087ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0099ms |
| stdev | 0.0079ms |
| min | 0.0083ms |
| max | 0.11ms |
| total | 1.98ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0085ms | 0.0093ms | -0.00088ms | -9.38% |
| p50 | 0.0087ms | 0.0096ms | -0.00087ms | -9.13% |
| p95 | 0.01ms | 0.01ms | +0.00071ms | +5.80% |
| p99 | 0.03ms | 0.02ms | +0.01ms | +65.83% |
| mean | 0.0099ms | 0.01ms | -0.00021ms | -2.04% |
| min | 0.0083ms | 0.0092ms | -0.00088ms | -9.55% |
| max | 0.11ms | 0.04ms | +0.08ms | +223.62% |
| total | 1.98ms | 2.02ms | -0.04ms | -2.04% |

### drivePublish

# Perf Report — drivePublish.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.01ms |
| stdev | 0.0037ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 2.80ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.000083ms | -0.64% |
| p50 | 0.01ms | 0.01ms | -0.000042ms | -0.32% |
| p95 | 0.02ms | 0.02ms | -0.0010ms | -6.36% |
| p99 | 0.04ms | 0.04ms | -0.0021ms | -5.72% |
| mean | 0.01ms | 0.01ms | -0.000067ms | -0.48% |
| min | 0.01ms | 0.01ms | -0.00013ms | -0.97% |
| max | 0.04ms | 0.05ms | -0.0046ms | -10.18% |
| total | 2.80ms | 2.82ms | -0.01ms | -0.48% |

