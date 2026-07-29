# Perf Suite — dogfood-redpanda-schema-registry

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveRegister | 0.0072ms | 0.02ms | 80ms | 0.00033ms | PASS | stable (p10 +9% (閾値未満)、 p95 +30% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveEvolution | 0.01ms | 0.02ms | 80ms | 0.00033ms | PASS | stable (p10 +11% (閾値未満)、 p95 +27% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveCompatibilityModes | 0.0085ms | 0.01ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| drivePublish | 0.01ms | 0.02ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveRegister | 0.13ms | 160ms | PASS |
| driveEvolution | 0.14ms | 160ms | PASS |
| driveCompatibilityModes | 0.10ms | 160ms | PASS |
| drivePublish | 0.19ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveRegister | -3560 B | 0 B | 102400 B | yes | PASS |
| driveEvolution | -9160 B | 0 B | 102400 B | yes | PASS |
| driveCompatibilityModes | 1352 B | 0 B | 102400 B | yes | PASS |
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
| stdev | 0.0068ms |
| min | 0.0067ms |
| max | 0.07ms |
| total | 1.87ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0072ms | 0.0066ms | +0.00058ms | +8.81% |
| p50 | 0.0075ms | 0.0075ms | -0.000020ms | -0.27% |
| p95 | 0.02ms | 0.01ms | +0.0042ms | +29.73% |
| p99 | 0.04ms | 0.05ms | -0.01ms | -21.58% |
| mean | 0.0093ms | 0.0091ms | +0.00020ms | +2.22% |
| min | 0.0067ms | 0.0063ms | +0.00042ms | +6.58% |
| max | 0.07ms | 0.07ms | +0.000042ms | +0.06% |
| total | 1.87ms | 1.83ms | +0.04ms | +2.22% |

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
| min | 0.01ms |
| max | 0.16ms |
| total | 2.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.0011ms | +11.21% |
| p50 | 0.01ms | 0.01ms | +0.0011ms | +10.76% |
| p95 | 0.02ms | 0.01ms | +0.0039ms | +27.43% |
| p99 | 0.03ms | 0.02ms | +0.0073ms | +35.59% |
| mean | 0.01ms | 0.01ms | +0.0021ms | +19.57% |
| min | 0.01ms | 0.0099ms | +0.0011ms | +10.97% |
| max | 0.16ms | 0.02ms | +0.14ms | +605.76% |
| total | 2.62ms | 2.19ms | +0.43ms | +19.57% |

### driveCompatibilityModes

# Perf Report — driveCompatibilityModes.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0085ms |
| p50 | 0.0096ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0083ms |
| max | 0.15ms |
| total | 2.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0085ms | 0.0093ms | -0.00079ms | -8.48% |
| p50 | 0.0096ms | 0.0096ms | +0.0000010ms | +0.01% |
| p95 | 0.01ms | 0.01ms | +0.0016ms | +13.04% |
| p99 | 0.03ms | 0.02ms | +0.02ms | +96.00% |
| mean | 0.01ms | 0.01ms | +0.00080ms | +7.98% |
| min | 0.0083ms | 0.0092ms | -0.00092ms | -9.99% |
| max | 0.15ms | 0.04ms | +0.11ms | +320.80% |
| total | 2.18ms | 2.02ms | +0.16ms | +7.98% |

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
| stdev | 0.0088ms |
| min | 0.01ms |
| max | 0.13ms |
| total | 2.85ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00033ms | -2.55% |
| p50 | 0.01ms | 0.01ms | -0.00038ms | -2.83% |
| p95 | 0.02ms | 0.02ms | -0.0013ms | -7.91% |
| p99 | 0.04ms | 0.04ms | -0.0014ms | -3.80% |
| mean | 0.01ms | 0.01ms | +0.00015ms | +1.07% |
| min | 0.01ms | 0.01ms | -0.00029ms | -2.28% |
| max | 0.13ms | 0.05ms | +0.08ms | +183.54% |
| total | 2.85ms | 2.82ms | +0.03ms | +1.07% |

