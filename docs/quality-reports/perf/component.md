# Perf Suite — component

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| buildButtonDriveCanvas | 0.01ms | 5ms | PASS | stable |
| buildFormDriveCanvas | 0.02ms | 10ms | PASS | stable |
| renderAndHashMarkup | 0.01ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| buildButtonDriveCanvas | 0.00ms | 10ms | PASS |
| buildFormDriveCanvas | 0.14ms | 20ms | PASS |
| renderAndHashMarkup | 0.11ms | 10ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| buildButtonDriveCanvas | -14840 B | 0 B | 102400 B | yes | PASS |
| buildFormDriveCanvas | 5312 B | 0 B | 102400 B | yes | PASS |
| renderAndHashMarkup | 464 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -3.25% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -18.18% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -13.31% |
| mean | 0.00ms | 0.00ms | -0.00ms | -14.31% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00ms | -13.63% |
| total | 0.06ms | 0.06ms | -0.01ms | -14.31% |

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
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -0.64% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -10.08% |
| p99 | 0.03ms | 0.03ms | +0.00ms | +6.29% |
| mean | 0.01ms | 0.01ms | +0.00ms | +4.86% |
| min | 0.00ms | 0.01ms | -0.00ms | -18.39% |
| max | 0.03ms | 0.03ms | +0.00ms | +14.14% |
| total | 0.26ms | 0.25ms | +0.01ms | +4.86% |

### renderAndHashMarkup

# Perf Report — renderAndHashMarkup.serial

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
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -29.24% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -11.46% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -22.40% |
| mean | 0.00ms | 0.01ms | -0.00ms | -20.84% |
| min | 0.00ms | 0.00ms | -0.00ms | -14.95% |
| max | 0.02ms | 0.02ms | -0.01ms | -25.97% |
| total | 0.15ms | 0.19ms | -0.04ms | -20.84% |

