# Perf Suite — dogfood-redpanda-schema-registry

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveRegister | 0.0069ms | 0.02ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveEvolution | 0.0098ms | 0.02ms | 80ms | 0.00033ms | PASS | stable (p10 -2% (閾値未満)、 p95 +22% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveCompatibilityModes | 0.0082ms | 0.01ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| drivePublish | 0.01ms | 0.01ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveRegister | 0.10ms | 160ms | PASS |
| driveEvolution | 0.47ms | 160ms | PASS |
| driveCompatibilityModes | 0.10ms | 160ms | PASS |
| drivePublish | 0.18ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveRegister | -3256 B | 0 B | 102400 B | yes | PASS |
| driveEvolution | -10608 B | 0 B | 102400 B | yes | PASS |
| driveCompatibilityModes | 192 B | 0 B | 102400 B | yes | PASS |
| drivePublish | -2176 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveRegister

# Perf Report — driveRegister.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0069ms |
| p50 | 0.0075ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0084ms |
| stdev | 0.0037ms |
| min | 0.0060ms |
| max | 0.04ms |
| total | 1.68ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0069ms | 0.0066ms | +0.00029ms | +4.35% |
| p50 | 0.0075ms | 0.0075ms | -0.000061ms | -0.82% |
| p95 | 0.02ms | 0.01ms | +0.0011ms | +8.06% |
| p99 | 0.02ms | 0.05ms | -0.03ms | -53.82% |
| mean | 0.0084ms | 0.0091ms | -0.00073ms | -7.99% |
| min | 0.0060ms | 0.0063ms | -0.00029ms | -4.59% |
| max | 0.04ms | 0.07ms | -0.04ms | -49.33% |
| total | 1.68ms | 1.83ms | -0.15ms | -7.99% |

### driveEvolution

# Perf Report — driveEvolution.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0098ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0097ms |
| max | 0.18ms |
| total | 2.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0098ms | 0.01ms | -0.00021ms | -2.07% |
| p50 | 0.01ms | 0.01ms | -0.00033ms | -3.19% |
| p95 | 0.02ms | 0.01ms | +0.0032ms | +22.28% |
| p99 | 0.03ms | 0.02ms | +0.0099ms | +48.63% |
| mean | 0.01ms | 0.01ms | +0.0010ms | +9.24% |
| min | 0.0097ms | 0.0099ms | -0.00021ms | -2.11% |
| max | 0.18ms | 0.02ms | +0.15ms | +668.11% |
| total | 2.39ms | 2.19ms | +0.20ms | +9.24% |

### driveCompatibilityModes

# Perf Report — driveCompatibilityModes.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0082ms |
| p50 | 0.0084ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0097ms |
| stdev | 0.0092ms |
| min | 0.0082ms |
| max | 0.13ms |
| total | 1.94ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0082ms | 0.0093ms | -0.0011ms | -11.66% |
| p50 | 0.0084ms | 0.0096ms | -0.0012ms | -12.17% |
| p95 | 0.01ms | 0.01ms | +0.00088ms | +7.18% |
| p99 | 0.03ms | 0.02ms | +0.01ms | +71.83% |
| mean | 0.0097ms | 0.01ms | -0.00037ms | -3.64% |
| min | 0.0082ms | 0.0092ms | -0.0010ms | -10.91% |
| max | 0.13ms | 0.04ms | +0.10ms | +277.79% |
| total | 1.94ms | 2.02ms | -0.07ms | -3.64% |

### drivePublish

# Perf Report — drivePublish.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0036ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 2.67ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00062ms | -4.78% |
| p50 | 0.01ms | 0.01ms | -0.00067ms | -5.03% |
| p95 | 0.01ms | 0.02ms | -0.0017ms | -10.30% |
| p99 | 0.03ms | 0.04ms | -0.0041ms | -10.95% |
| mean | 0.01ms | 0.01ms | -0.00071ms | -5.02% |
| min | 0.01ms | 0.01ms | -0.00063ms | -4.87% |
| max | 0.04ms | 0.05ms | -0.0051ms | -11.29% |
| total | 2.67ms | 2.82ms | -0.14ms | -5.02% |

