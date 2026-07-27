# Perf Suite — component

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| buildButtonDriveCanvas | 0.01ms | 5ms | PASS | stable |
| buildFormDriveCanvas | 0.02ms | 10ms | PASS | stable |
| renderAndHashMarkup | 0.02ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| buildButtonDriveCanvas | 0.01ms | 10ms | PASS |
| buildFormDriveCanvas | 0.18ms | 20ms | PASS |
| renderAndHashMarkup | 0.21ms | 10ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| buildButtonDriveCanvas | -14784 B | -17686 B | 102400 B | yes | PASS |
| buildFormDriveCanvas | 190504 B | 0 B | 102400 B | yes | PASS |
| renderAndHashMarkup | 912 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +9.67% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +30.37% |
| p99 | 0.02ms | 0.01ms | +0.00ms | +37.77% |
| mean | 0.00ms | 0.00ms | +0.00ms | +29.93% |
| min | 0.00ms | 0.00ms | +0.00ms | +7.76% |
| max | 0.02ms | 0.01ms | +0.01ms | +47.36% |
| total | 0.08ms | 0.06ms | +0.02ms | +29.93% |

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
| min | 0.01ms |
| max | 0.04ms |
| total | 0.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +18.90% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +14.49% |
| p99 | 0.03ms | 0.03ms | +0.01ms | +27.40% |
| mean | 0.01ms | 0.01ms | +0.00ms | +28.17% |
| min | 0.01ms | 0.01ms | +0.00ms | +0.81% |
| max | 0.04ms | 0.03ms | +0.01ms | +32.89% |
| total | 0.32ms | 0.25ms | +0.07ms | +28.17% |

### renderAndHashMarkup

# Perf Report — renderAndHashMarkup.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.03ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -6.10% |
| p95 | 0.02ms | 0.01ms | +0.01ms | +63.57% |
| p99 | 0.03ms | 0.02ms | +0.01ms | +42.73% |
| mean | 0.01ms | 0.01ms | +0.00ms | +34.17% |
| min | 0.00ms | 0.00ms | -0.00ms | -10.34% |
| max | 0.03ms | 0.02ms | +0.01ms | +39.04% |
| total | 0.25ms | 0.19ms | +0.06ms | +34.17% |

