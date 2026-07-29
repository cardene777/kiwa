# Perf Suite — dogfood-redpanda-schema-registry

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveRegister | 0.0072ms | 0.02ms | 80ms | 0.00033ms | PASS | stable (p10 +8% (閾値未満)、 p95 +39% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveEvolution | 0.01ms | 0.02ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveCompatibilityModes | 0.0088ms | 0.01ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| drivePublish | 0.02ms | 0.02ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveRegister | 0.21ms | 160ms | PASS |
| driveEvolution | 0.14ms | 160ms | PASS |
| driveCompatibilityModes | 0.11ms | 160ms | PASS |
| drivePublish | 0.35ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveRegister | -3272 B | 0 B | 102400 B | yes | PASS |
| driveEvolution | -9696 B | 0 B | 102400 B | yes | PASS |
| driveCompatibilityModes | 2224 B | 0 B | 102400 B | yes | PASS |
| drivePublish | -2368 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveRegister

# Perf Report — driveRegister.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0072ms |
| p50 | 0.0077ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0095ms |
| stdev | 0.0052ms |
| min | 0.0067ms |
| max | 0.06ms |
| total | 1.91ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0072ms | 0.0066ms | +0.00055ms | +8.25% |
| p50 | 0.0077ms | 0.0075ms | +0.00019ms | +2.49% |
| p95 | 0.02ms | 0.01ms | +0.0055ms | +39.00% |
| p99 | 0.02ms | 0.05ms | -0.02ms | -50.33% |
| mean | 0.0095ms | 0.0091ms | +0.00040ms | +4.39% |
| min | 0.0067ms | 0.0063ms | +0.00042ms | +6.58% |
| max | 0.06ms | 0.07ms | -0.02ms | -23.37% |
| total | 1.91ms | 1.83ms | +0.08ms | +4.39% |

### driveEvolution

# Perf Report — driveEvolution.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0065ms |
| min | 0.01ms |
| max | 0.10ms |
| total | 2.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00063ms | +6.23% |
| p50 | 0.01ms | 0.01ms | +0.00077ms | +7.37% |
| p95 | 0.02ms | 0.01ms | +0.0020ms | +14.38% |
| p99 | 0.02ms | 0.02ms | +0.0025ms | +12.28% |
| mean | 0.01ms | 0.01ms | +0.0012ms | +11.32% |
| min | 0.01ms | 0.0099ms | +0.00067ms | +6.74% |
| max | 0.10ms | 0.02ms | +0.08ms | +326.31% |
| total | 2.44ms | 2.19ms | +0.25ms | +11.32% |

### driveCompatibilityModes

# Perf Report — driveCompatibilityModes.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0088ms |
| p50 | 0.0091ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0098ms |
| stdev | 0.0062ms |
| min | 0.0087ms |
| max | 0.10ms |
| total | 1.96ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0088ms | 0.0093ms | -0.00050ms | -5.36% |
| p50 | 0.0091ms | 0.0096ms | -0.00046ms | -4.78% |
| p95 | 0.01ms | 0.01ms | -0.0012ms | -9.56% |
| p99 | 0.02ms | 0.02ms | -0.0027ms | -15.37% |
| mean | 0.0098ms | 0.01ms | -0.00029ms | -2.84% |
| min | 0.0087ms | 0.0092ms | -0.00050ms | -5.44% |
| max | 0.10ms | 0.04ms | +0.06ms | +169.21% |
| total | 1.96ms | 2.02ms | -0.06ms | -2.84% |

### drivePublish

# Perf Report — drivePublish.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.0038ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 3.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.01ms | +0.0021ms | +16.30% |
| p50 | 0.02ms | 0.01ms | +0.0030ms | +22.96% |
| p95 | 0.02ms | 0.02ms | +0.0022ms | +13.25% |
| p99 | 0.04ms | 0.04ms | +0.00055ms | +1.49% |
| mean | 0.02ms | 0.01ms | +0.0028ms | +19.79% |
| min | 0.01ms | 0.01ms | +0.0013ms | +9.75% |
| max | 0.04ms | 0.05ms | -0.0023ms | -5.18% |
| total | 3.37ms | 2.82ms | +0.56ms | +19.79% |

