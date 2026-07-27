# Perf Suite — component

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| buildButtonDriveCanvas | 0.02ms | 5ms | PASS | stable |
| buildFormDriveCanvas | 0.02ms | 10ms | PASS | stable |
| renderAndHashMarkup | 0.02ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| buildButtonDriveCanvas | 0.01ms | 10ms | PASS |
| buildFormDriveCanvas | 0.14ms | 20ms | PASS |
| renderAndHashMarkup | 0.66ms | 10ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| buildButtonDriveCanvas | -13680 B | 0 B | 102400 B | yes | PASS |
| buildFormDriveCanvas | 8800 B | 0 B | 102400 B | yes | PASS |
| renderAndHashMarkup | 2288 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### buildButtonDriveCanvas

# Perf Report — buildButtonDriveCanvas.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.00ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.03ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +141.87% |
| p95 | 0.02ms | 0.01ms | +0.01ms | +96.08% |
| p99 | 0.03ms | 0.01ms | +0.01ms | +111.76% |
| mean | 0.00ms | 0.00ms | +0.00ms | +116.34% |
| min | 0.00ms | 0.00ms | +0.00ms | +115.53% |
| max | 0.03ms | 0.01ms | +0.02ms | +118.26% |
| total | 0.14ms | 0.06ms | +0.07ms | +116.34% |

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
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -1.30% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -0.32% |
| p99 | 0.03ms | 0.03ms | +0.00ms | +12.12% |
| mean | 0.01ms | 0.01ms | +0.00ms | +14.53% |
| min | 0.00ms | 0.01ms | -0.00ms | -6.39% |
| max | 0.03ms | 0.03ms | +0.01ms | +19.35% |
| total | 0.29ms | 0.25ms | +0.04ms | +14.53% |

### renderAndHashMarkup

# Perf Report — renderAndHashMarkup.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -12.22% |
| p95 | 0.02ms | 0.01ms | +0.00ms | +1.91% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -8.13% |
| mean | 0.01ms | 0.01ms | -0.00ms | -7.93% |
| min | 0.00ms | 0.00ms | +0.00ms | +1.13% |
| max | 0.02ms | 0.02ms | -0.00ms | -10.13% |
| total | 0.17ms | 0.19ms | -0.01ms | -7.93% |

