# Perf Suite — feature-flag

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| evaluateFlag | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +38638%) 以上の悪化が必要) |
| evaluateAllFlags | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +38728%) 以上の悪化が必要) |
| registerRule | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +149209%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluateFlag | 0.01ms | 10ms | PASS |
| evaluateAllFlags | 0.02ms | 10ms | PASS |
| registerRule | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluateFlag | 25424 B | 0 B | 102400 B | yes | PASS |
| evaluateAllFlags | 71264 B | 0 B | 102400 B | yes | PASS |
| registerRule | 18800 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluateFlag

# Perf Report — evaluateFlag.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -6.72% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +0.16% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +4.52% |
| mean | 0.00ms | 0.00ms | -0.00ms | -11.94% |
| min | 0.00ms | 0.00ms | -0.00ms | -35.68% |
| max | 0.02ms | 0.02ms | -0.00ms | -0.52% |
| total | 0.15ms | 0.18ms | -0.02ms | -11.94% |

### evaluateAllFlags

# Perf Report — evaluateAllFlags.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +9.76% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +32.01% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.53% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.00ms | +0.01ms | +213.23% |
| total | 0.22ms | 0.21ms | +0.00ms | +1.53% |

### registerRule

# Perf Report — registerRule.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.03ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -16.40% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +24.77% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +28.12% |
| mean | 0.00ms | 0.00ms | +0.00ms | +37.95% |
| min | 0.00ms | 0.00ms | -0.00ms | -0.60% |
| max | 0.03ms | 0.01ms | +0.02ms | +242.12% |
| total | 0.08ms | 0.06ms | +0.02ms | +37.95% |

