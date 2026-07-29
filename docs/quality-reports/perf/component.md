# Perf Suite — component

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| buildButtonDriveCanvas | 0.01ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +5290%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| buildFormDriveCanvas | 0.03ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +3088%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| renderAndHashMarkup | 0.42ms | 5ms | PASS | stable (差 0.40ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| buildButtonDriveCanvas | 0.00ms | 10ms | PASS |
| buildFormDriveCanvas | 2.19ms | 20ms | PASS |
| renderAndHashMarkup | 6.02ms | 10ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| buildButtonDriveCanvas | -14424 B | 0 B | 102400 B | yes | PASS |
| buildFormDriveCanvas | -4352 B | 0 B | 102400 B | yes | PASS |
| renderAndHashMarkup | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### buildButtonDriveCanvas

# Perf Report — buildButtonDriveCanvas.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +5.21% |
| p99 | 0.01ms | 0.02ms | -0.00ms | -17.86% |
| mean | 0.00ms | 0.00ms | -0.00ms | -0.93% |
| min | 0.00ms | 0.00ms | +0.00ms | +7.56% |
| max | 0.01ms | 0.02ms | -0.00ms | -23.17% |
| total | 0.07ms | 0.07ms | -0.00ms | -0.93% |

### buildFormDriveCanvas

# Perf Report — buildFormDriveCanvas.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.42ms |
| mean | 0.03ms |
| stdev | 0.10ms |
| min | 0.01ms |
| max | 0.57ms |
| total | 0.86ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +33.82% |
| p95 | 0.03ms | 0.02ms | +0.01ms | +68.61% |
| p99 | 0.42ms | 0.03ms | +0.39ms | +1556.77% |
| mean | 0.03ms | 0.01ms | +0.02ms | +254.54% |
| min | 0.01ms | 0.01ms | +0.00ms | +15.89% |
| max | 0.57ms | 0.03ms | +0.55ms | +1930.39% |
| total | 0.86ms | 0.24ms | +0.62ms | +254.54% |

### renderAndHashMarkup

# Perf Report — renderAndHashMarkup.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.42ms |
| p99 | 3.25ms |
| mean | 0.19ms |
| stdev | 0.79ms |
| min | 0.00ms |
| max | 4.32ms |
| total | 5.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.00ms | +0.00ms | +114.44% |
| p95 | 0.42ms | 0.01ms | +0.40ms | +3287.68% |
| p99 | 3.25ms | 0.02ms | +3.23ms | +17614.84% |
| mean | 0.19ms | 0.01ms | +0.18ms | +3441.54% |
| min | 0.00ms | 0.00ms | +0.00ms | +1.26% |
| max | 4.32ms | 0.02ms | +4.30ms | +21862.82% |
| total | 5.57ms | 0.16ms | +5.41ms | +3441.54% |

