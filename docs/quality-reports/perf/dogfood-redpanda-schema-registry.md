# Perf Suite — dogfood-redpanda-schema-registry

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveRegister | 0.0080ms | 0.02ms | 80ms | 0.00033ms | PASS | regressed — gate 無効 (regressionGate=false) |
| driveEvolution | 0.01ms | 0.03ms | 80ms | 0.00033ms | PASS | stable (p10 +9% (閾値未満)、 p95 +79% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveCompatibilityModes | 0.0091ms | 0.01ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| drivePublish | 0.01ms | 0.08ms | 80ms | 0.00033ms | PASS | stable (p10 +2% (閾値未満)、 p95 +386% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveRegister | 0.10ms | 160ms | PASS |
| driveEvolution | 0.13ms | 160ms | PASS |
| driveCompatibilityModes | 0.29ms | 160ms | PASS |
| drivePublish | 0.45ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveRegister | -3048 B | 0 B | 102400 B | yes | PASS |
| driveEvolution | -10456 B | 0 B | 102400 B | yes | PASS |
| driveCompatibilityModes | 2296 B | 0 B | 102400 B | yes | PASS |
| drivePublish | -928 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveRegister

# Perf Report — driveRegister.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0080ms |
| p50 | 0.0084ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0099ms |
| stdev | 0.0052ms |
| min | 0.0070ms |
| max | 0.05ms |
| total | 1.98ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0080ms | 0.0066ms | +0.0014ms | +20.83% |
| p50 | 0.0084ms | 0.0075ms | +0.00092ms | +12.19% |
| p95 | 0.02ms | 0.01ms | +0.0033ms | +23.73% |
| p99 | 0.03ms | 0.05ms | -0.02ms | -36.44% |
| mean | 0.0099ms | 0.0091ms | +0.00078ms | +8.54% |
| min | 0.0070ms | 0.0063ms | +0.00067ms | +10.53% |
| max | 0.05ms | 0.07ms | -0.02ms | -29.38% |
| total | 1.98ms | 1.83ms | +0.16ms | +8.54% |

### driveEvolution

# Perf Report — driveEvolution.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.13ms |
| mean | 0.02ms |
| stdev | 0.07ms |
| min | 0.01ms |
| max | 0.86ms |
| total | 4.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00092ms | +9.13% |
| p50 | 0.01ms | 0.01ms | +0.00092ms | +8.76% |
| p95 | 0.03ms | 0.01ms | +0.01ms | +78.99% |
| p99 | 0.13ms | 0.02ms | +0.11ms | +555.92% |
| mean | 0.02ms | 0.01ms | +0.01ms | +93.34% |
| min | 0.01ms | 0.0099ms | +0.00083ms | +8.44% |
| max | 0.86ms | 0.02ms | +0.83ms | +3602.52% |
| total | 4.24ms | 2.19ms | +2.05ms | +93.34% |

### driveCompatibilityModes

# Perf Report — driveCompatibilityModes.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0091ms |
| p50 | 0.0093ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0081ms |
| min | 0.0088ms |
| max | 0.12ms |
| total | 2.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0091ms | 0.0093ms | -0.00025ms | -2.69% |
| p50 | 0.0093ms | 0.0096ms | -0.00029ms | -3.05% |
| p95 | 0.01ms | 0.01ms | -0.00021ms | -1.71% |
| p99 | 0.02ms | 0.02ms | +0.0035ms | +19.86% |
| mean | 0.01ms | 0.01ms | +0.00028ms | +2.75% |
| min | 0.0088ms | 0.0092ms | -0.00033ms | -3.62% |
| max | 0.12ms | 0.04ms | +0.08ms | +235.14% |
| total | 2.07ms | 2.02ms | +0.06ms | +2.75% |

### drivePublish

# Perf Report — drivePublish.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.08ms |
| p99 | 0.26ms |
| mean | 0.03ms |
| stdev | 0.05ms |
| min | 0.01ms |
| max | 0.57ms |
| total | 5.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00029ms | +2.21% |
| p50 | 0.02ms | 0.01ms | +0.0024ms | +18.24% |
| p95 | 0.08ms | 0.02ms | +0.06ms | +386.39% |
| p99 | 0.26ms | 0.04ms | +0.22ms | +593.83% |
| mean | 0.03ms | 0.01ms | +0.01ms | +93.71% |
| min | 0.01ms | 0.01ms | +0.000042ms | +0.33% |
| max | 0.57ms | 0.05ms | +0.53ms | +1175.04% |
| total | 5.46ms | 2.82ms | +2.64ms | +93.71% |

