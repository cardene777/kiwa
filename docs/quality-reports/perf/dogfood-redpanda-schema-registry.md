# Perf Suite — dogfood-redpanda-schema-registry

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveRegister | 0.0069ms | 0.02ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveEvolution | 0.0097ms | 0.02ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveCompatibilityModes | 0.0082ms | 0.02ms | 80ms | 0.00033ms | PASS | stable (p10 -12% (閾値未満)、 p95 +33% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| drivePublish | 0.01ms | 0.02ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveRegister | 0.11ms | 160ms | PASS |
| driveEvolution | 0.13ms | 160ms | PASS |
| driveCompatibilityModes | 0.10ms | 160ms | PASS |
| drivePublish | 0.16ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveRegister | -3048 B | 0 B | 102400 B | yes | PASS |
| driveEvolution | -10920 B | 0 B | 102400 B | yes | PASS |
| driveCompatibilityModes | 2448 B | 0 B | 102400 B | yes | PASS |
| drivePublish | -2464 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveRegister

# Perf Report — driveRegister.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0069ms |
| p50 | 0.0072ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0087ms |
| stdev | 0.0049ms |
| min | 0.0066ms |
| max | 0.05ms |
| total | 1.74ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0069ms | 0.0066ms | +0.00025ms | +3.84% |
| p50 | 0.0072ms | 0.0075ms | -0.00031ms | -4.14% |
| p95 | 0.02ms | 0.01ms | +0.0025ms | +17.83% |
| p99 | 0.03ms | 0.05ms | -0.02ms | -36.56% |
| mean | 0.0087ms | 0.0091ms | -0.00044ms | -4.81% |
| min | 0.0066ms | 0.0063ms | +0.00025ms | +3.95% |
| max | 0.05ms | 0.07ms | -0.03ms | -34.66% |
| total | 1.74ms | 1.83ms | -0.09ms | -4.81% |

### driveEvolution

# Perf Report — driveEvolution.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0097ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0074ms |
| min | 0.0095ms |
| max | 0.09ms |
| total | 2.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0097ms | 0.01ms | -0.00034ms | -3.36% |
| p50 | 0.01ms | 0.01ms | -0.00038ms | -3.59% |
| p95 | 0.02ms | 0.01ms | +0.0028ms | +19.64% |
| p99 | 0.03ms | 0.02ms | +0.01ms | +62.18% |
| mean | 0.01ms | 0.01ms | +0.00055ms | +5.06% |
| min | 0.0095ms | 0.0099ms | -0.00038ms | -3.80% |
| max | 0.09ms | 0.02ms | +0.07ms | +293.33% |
| total | 2.30ms | 2.19ms | +0.11ms | +5.06% |

### driveCompatibilityModes

# Perf Report — driveCompatibilityModes.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0082ms |
| p50 | 0.0085ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0081ms |
| max | 0.16ms |
| total | 2.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0082ms | 0.0093ms | -0.0011ms | -11.66% |
| p50 | 0.0085ms | 0.0096ms | -0.0011ms | -11.30% |
| p95 | 0.02ms | 0.01ms | +0.0041ms | +33.40% |
| p99 | 0.04ms | 0.02ms | +0.02ms | +121.32% |
| mean | 0.01ms | 0.01ms | +0.00024ms | +2.40% |
| min | 0.0081ms | 0.0092ms | -0.0010ms | -11.36% |
| max | 0.16ms | 0.04ms | +0.12ms | +346.77% |
| total | 2.07ms | 2.02ms | +0.05ms | +2.40% |

### drivePublish

# Perf Report — drivePublish.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0031ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 2.77ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00025ms | -1.91% |
| p50 | 0.01ms | 0.01ms | -0.00013ms | -0.94% |
| p95 | 0.02ms | 0.02ms | -0.00034ms | -2.03% |
| p99 | 0.03ms | 0.04ms | -0.0062ms | -16.64% |
| mean | 0.01ms | 0.01ms | -0.00024ms | -1.71% |
| min | 0.01ms | 0.01ms | -0.00029ms | -2.27% |
| max | 0.04ms | 0.05ms | -0.0095ms | -21.18% |
| total | 2.77ms | 2.82ms | -0.05ms | -1.71% |

