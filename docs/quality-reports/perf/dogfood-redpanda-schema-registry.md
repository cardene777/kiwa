# Perf Suite — dogfood-redpanda-schema-registry

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveRegister | 0.0065ms | 0.01ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveEvolution | 0.01ms | 0.02ms | 80ms | 0.00033ms | PASS | stable (p10 +0% (閾値未満)、 p95 +23% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveCompatibilityModes | 0.0094ms | 0.02ms | 80ms | 0.00033ms | PASS | stable (p10 +1% (閾値未満)、 p95 +30% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| drivePublish | 0.01ms | 0.02ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveRegister | 0.10ms | 160ms | PASS |
| driveEvolution | 0.12ms | 160ms | PASS |
| driveCompatibilityModes | 0.10ms | 160ms | PASS |
| drivePublish | 0.16ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveRegister | -3096 B | 0 B | 102400 B | yes | PASS |
| driveEvolution | -10848 B | 0 B | 102400 B | yes | PASS |
| driveCompatibilityModes | 1232 B | 0 B | 102400 B | yes | PASS |
| drivePublish | 488 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveRegister

# Perf Report — driveRegister.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0065ms |
| p50 | 0.0074ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0084ms |
| stdev | 0.0037ms |
| min | 0.0062ms |
| max | 0.04ms |
| total | 1.67ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0065ms | 0.0066ms | -0.000087ms | -1.32% |
| p50 | 0.0074ms | 0.0075ms | -0.00010ms | -1.38% |
| p95 | 0.01ms | 0.01ms | -0.00022ms | -1.59% |
| p99 | 0.02ms | 0.05ms | -0.03ms | -54.59% |
| mean | 0.0084ms | 0.0091ms | -0.00077ms | -8.37% |
| min | 0.0062ms | 0.0063ms | -0.00017ms | -2.64% |
| max | 0.04ms | 0.07ms | -0.04ms | -49.27% |
| total | 1.67ms | 1.83ms | -0.15ms | -8.37% |

### driveEvolution

# Perf Report — driveEvolution.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.05ms |
| mean | 0.01ms |
| stdev | 0.0084ms |
| min | 0.0099ms |
| max | 0.11ms |
| total | 2.41ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +9.0e-7ms | +0.01% |
| p50 | 0.01ms | 0.01ms | +0.00012ms | +1.19% |
| p95 | 0.02ms | 0.01ms | +0.0033ms | +23.07% |
| p99 | 0.05ms | 0.02ms | +0.03ms | +134.30% |
| mean | 0.01ms | 0.01ms | +0.0011ms | +10.07% |
| min | 0.0099ms | 0.0099ms | 0.00ms | 0.00% |
| max | 0.11ms | 0.02ms | +0.09ms | +377.48% |
| total | 2.41ms | 2.19ms | +0.22ms | +10.07% |

### driveCompatibilityModes

# Perf Report — driveCompatibilityModes.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0094ms |
| p50 | 0.0098ms |
| p95 | 0.02ms |
| p99 | 0.06ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0091ms |
| max | 0.13ms |
| total | 2.43ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0094ms | 0.0093ms | +0.000083ms | +0.89% |
| p50 | 0.0098ms | 0.0096ms | +0.00021ms | +2.17% |
| p95 | 0.02ms | 0.01ms | +0.0037ms | +30.49% |
| p99 | 0.06ms | 0.02ms | +0.04ms | +243.54% |
| mean | 0.01ms | 0.01ms | +0.0021ms | +20.45% |
| min | 0.0091ms | 0.0092ms | -0.000041ms | -0.45% |
| max | 0.13ms | 0.04ms | +0.10ms | +277.56% |
| total | 2.43ms | 2.02ms | +0.41ms | +20.45% |

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
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.25ms |
| total | 3.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00021ms | +1.60% |
| p50 | 0.01ms | 0.01ms | +0.00067ms | +5.03% |
| p95 | 0.02ms | 0.02ms | +0.0028ms | +16.98% |
| p99 | 0.04ms | 0.04ms | +0.0013ms | +3.50% |
| mean | 0.02ms | 0.01ms | +0.0021ms | +14.78% |
| min | 0.01ms | 0.01ms | -0.0013ms | -10.39% |
| max | 0.25ms | 0.05ms | +0.20ms | +446.82% |
| total | 3.23ms | 2.82ms | +0.42ms | +14.78% |

