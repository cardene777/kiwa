# Perf Suite — dogfood-solidjs-signal-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveCounter | 0.01ms | 0.02ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveTodos | 0.01ms | 0.02ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveResource | 0.0034ms | 0.0094ms | 100ms | 0.00033ms | PASS | improved — gate 無効 (regressionGate=false) |
| driveSuspense | 1.15ms | 1.21ms | 150ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveCounter | 0.20ms | 100ms | PASS |
| driveTodos | 0.24ms | 160ms | PASS |
| driveResource | 0.06ms | 200ms | PASS |
| driveSuspense | 1.28ms | 300ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveCounter | -2816 B | 0 B | 102400 B | yes | PASS |
| driveTodos | 7160 B | 0 B | 102400 B | yes | PASS |
| driveResource | 2696 B | 0 B | 102400 B | yes | PASS |
| driveSuspense | 1520 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveCounter

# Perf Report — driveCounter.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.0088ms |
| max | 0.23ms |
| total | 2.91ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00038ms | -3.54% |
| p50 | 0.01ms | 0.01ms | -0.00052ms | -4.31% |
| p95 | 0.02ms | 0.02ms | -0.0020ms | -8.41% |
| p99 | 0.04ms | 0.04ms | -0.00088ms | -2.22% |
| mean | 0.01ms | 0.02ms | -0.00076ms | -4.99% |
| min | 0.0088ms | 0.0089ms | -0.000084ms | -0.95% |
| max | 0.23ms | 0.35ms | -0.12ms | -35.35% |
| total | 2.91ms | 3.06ms | -0.15ms | -4.99% |

### driveTodos

# Perf Report — driveTodos.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0097ms |
| min | 0.01ms |
| max | 0.14ms |
| total | 3.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00055ms | -3.70% |
| p50 | 0.01ms | 0.02ms | -0.0016ms | -9.80% |
| p95 | 0.02ms | 0.03ms | -0.0046ms | -15.90% |
| p99 | 0.03ms | 0.07ms | -0.04ms | -53.64% |
| mean | 0.02ms | 0.02ms | -0.0023ms | -12.00% |
| min | 0.01ms | 0.01ms | -0.00025ms | -1.77% |
| max | 0.14ms | 0.15ms | -0.0039ms | -2.66% |
| total | 3.34ms | 3.80ms | -0.46ms | -12.00% |

### driveResource

# Perf Report — driveResource.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0034ms |
| p50 | 0.0045ms |
| p95 | 0.0094ms |
| p99 | 0.02ms |
| mean | 0.0050ms |
| stdev | 0.0032ms |
| min | 0.0032ms |
| max | 0.03ms |
| total | 1.00ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0034ms | 0.0043ms | -0.00096ms | -22.11% |
| p50 | 0.0045ms | 0.0045ms | 0.00ms | 0.00% |
| p95 | 0.0094ms | 0.01ms | -0.0012ms | -11.44% |
| p99 | 0.02ms | 0.02ms | +0.0023ms | +13.03% |
| mean | 0.0050ms | 0.0052ms | -0.00021ms | -4.01% |
| min | 0.0032ms | 0.0042ms | -0.0010ms | -23.78% |
| max | 0.03ms | 0.03ms | +0.0030ms | +10.11% |
| total | 1.00ms | 1.04ms | -0.04ms | -4.01% |

### driveSuspense

# Perf Report — driveSuspense.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 1.15ms |
| p50 | 1.17ms |
| p95 | 1.21ms |
| p99 | 1.25ms |
| mean | 1.14ms |
| stdev | 0.20ms |
| min | 0.02ms |
| max | 1.26ms |
| total | 228.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 1.15ms | 1.15ms | +0.0011ms | +0.10% |
| p50 | 1.17ms | 1.16ms | +0.0061ms | +0.52% |
| p95 | 1.21ms | 1.20ms | +0.01ms | +0.96% |
| p99 | 1.25ms | 1.24ms | +0.0025ms | +0.20% |
| mean | 1.14ms | 1.15ms | -0.0048ms | -0.42% |
| min | 0.02ms | 0.03ms | -0.0064ms | -21.21% |
| max | 1.26ms | 1.40ms | -0.14ms | -10.19% |
| total | 228.16ms | 229.13ms | -0.97ms | -0.42% |

