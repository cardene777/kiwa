# Perf Suite — component

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| buildButtonDriveCanvas | 0.01ms | 5ms | PASS | stable |
| buildFormDriveCanvas | 0.01ms | 10ms | PASS | stable |
| renderAndHashMarkup | 0.01ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| buildButtonDriveCanvas | 0.01ms | 10ms | PASS |
| buildFormDriveCanvas | 0.02ms | 20ms | PASS |
| renderAndHashMarkup | 0.02ms | 10ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| buildButtonDriveCanvas | 56600 B | 0 B | 102400 B | PASS |
| buildFormDriveCanvas | 464144 B | 0 B | 102400 B | PASS |
| renderAndHashMarkup | 189328 B | 0 B | 102400 B | PASS |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +40.00% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +44.29% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +49.58% |
| mean | 0.00ms | 0.00ms | +0.00ms | +30.23% |
| min | 0.00ms | 0.00ms | +0.00ms | +23.11% |
| max | 0.01ms | 0.01ms | +0.00ms | +49.58% |
| total | 0.07ms | 0.06ms | +0.02ms | +30.23% |

### buildFormDriveCanvas

# Perf Report — buildFormDriveCanvas.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.03ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +1.72% |
| p95 | 0.01ms | 0.03ms | -0.01ms | -46.42% |
| p99 | 0.03ms | 0.03ms | -0.00ms | -9.00% |
| mean | 0.01ms | 0.01ms | -0.00ms | -19.96% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.03ms | 0.03ms | -0.00ms | -9.00% |
| total | 0.22ms | 0.28ms | -0.06ms | -19.96% |

### renderAndHashMarkup

# Perf Report — renderAndHashMarkup.serial

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
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -2.46% |
| p95 | 0.01ms | 0.02ms | -0.00ms | -19.24% |
| p99 | 0.01ms | 0.02ms | -0.00ms | -16.67% |
| mean | 0.00ms | 0.01ms | -0.00ms | -14.66% |
| min | 0.00ms | 0.00ms | +0.00ms | +8.82% |
| max | 0.01ms | 0.02ms | -0.00ms | -16.67% |
| total | 0.14ms | 0.16ms | -0.02ms | -14.66% |

