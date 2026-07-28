# Perf Suite — component

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| buildButtonDriveCanvas | 0.01ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +5290%) 以上の悪化が必要) |
| buildFormDriveCanvas | 0.02ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +3088%) 以上の悪化が必要) |
| renderAndHashMarkup | 0.01ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +4060%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| buildButtonDriveCanvas | 0.00ms | 10ms | PASS |
| buildFormDriveCanvas | 0.17ms | 20ms | PASS |
| renderAndHashMarkup | 0.22ms | 10ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| buildButtonDriveCanvas | -14872 B | 0 B | 102400 B | yes | PASS |
| buildFormDriveCanvas | 5840 B | 0 B | 102400 B | yes | PASS |
| renderAndHashMarkup | -680 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### buildButtonDriveCanvas

# Perf Report — buildButtonDriveCanvas.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -9.37% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +4.32% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +2.19% |
| mean | 0.00ms | 0.00ms | -0.00ms | -0.18% |
| min | 0.00ms | 0.00ms | -0.00ms | -7.75% |
| max | 0.02ms | 0.02ms | +0.00ms | +2.93% |
| total | 0.07ms | 0.07ms | -0.00ms | -0.18% |

### buildFormDriveCanvas

# Perf Report — buildFormDriveCanvas.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.03ms |
| total | 0.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +25.44% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -1.80% |
| p99 | 0.03ms | 0.03ms | +0.00ms | +13.65% |
| mean | 0.01ms | 0.01ms | +0.00ms | +15.12% |
| min | 0.00ms | 0.01ms | -0.00ms | -11.12% |
| max | 0.03ms | 0.03ms | +0.01ms | +19.74% |
| total | 0.28ms | 0.24ms | +0.04ms | +15.12% |

### renderAndHashMarkup

# Perf Report — renderAndHashMarkup.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -4.63% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +16.88% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -7.74% |
| mean | 0.01ms | 0.01ms | -0.00ms | -4.27% |
| min | 0.00ms | 0.00ms | -0.00ms | -5.14% |
| max | 0.02ms | 0.02ms | -0.00ms | -9.74% |
| total | 0.15ms | 0.16ms | -0.01ms | -4.27% |

