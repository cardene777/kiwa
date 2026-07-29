# Perf Suite — cli-test

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| writeFile | 5.64ms | 20ms | PASS | regressed — gate 無効 (regressionGate=false) |
| readFile | 2.02ms | 10ms | PASS | regressed — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| writeFile | 2.20ms | 40ms | PASS |
| readFile | 15.25ms | 20ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| writeFile | 2312 B | -113830 B | 102400 B | yes | PASS |
| readFile | -10344 B | -73205 B | 102400 B | yes | PASS |

## Detailed serial reports

### writeFile

# Perf Report — writeFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p50 | 0.72ms |
| p95 | 5.64ms |
| p99 | 6.47ms |
| mean | 1.39ms |
| stdev | 1.54ms |
| min | 0.20ms |
| max | 6.61ms |
| total | 139.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.72ms | 0.34ms | +0.38ms | +109.96% |
| p95 | 5.64ms | 0.93ms | +4.71ms | +505.81% |
| p99 | 6.47ms | 1.70ms | +4.77ms | +280.30% |
| mean | 1.39ms | 0.47ms | +0.92ms | +195.42% |
| min | 0.20ms | 0.12ms | +0.08ms | +66.94% |
| max | 6.61ms | 10.31ms | -3.70ms | -35.85% |
| total | 139.26ms | 82.96ms | +56.29ms | +67.85% |

### readFile

# Perf Report — readFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p50 | 0.27ms |
| p95 | 2.02ms |
| p99 | 3.92ms |
| mean | 0.59ms |
| stdev | 0.92ms |
| min | 0.07ms |
| max | 6.55ms |
| total | 58.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.27ms | 0.13ms | +0.13ms | +98.85% |
| p95 | 2.02ms | 0.21ms | +1.81ms | +863.50% |
| p99 | 3.92ms | 0.25ms | +3.67ms | +1454.02% |
| mean | 0.59ms | 0.14ms | +0.45ms | +329.39% |
| min | 0.07ms | 0.08ms | -0.01ms | -7.65% |
| max | 6.55ms | 0.27ms | +6.28ms | +2295.05% |
| total | 58.60ms | 24.02ms | +34.58ms | +143.97% |

