# Perf Suite — feature-flag

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| evaluateFlag | 0.00ms | 5ms | PASS | stable |
| evaluateAllFlags | 0.00ms | 5ms | PASS | stable |
| registerRule | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluateFlag | 0.01ms | 10ms | PASS |
| evaluateAllFlags | 0.02ms | 10ms | PASS |
| registerRule | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluateFlag | 22560 B | 0 B | 102400 B | yes | PASS |
| evaluateAllFlags | 71480 B | 0 B | 102400 B | yes | PASS |
| registerRule | 20232 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.01ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +7.56% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +0.15% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +29.16% |
| mean | 0.00ms | 0.00ms | +0.00ms | +5.15% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +6.17% |
| total | 0.15ms | 0.14ms | +0.01ms | +5.15% |

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
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -3.29% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +19.61% |
| mean | 0.00ms | 0.00ms | +0.00ms | +3.48% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.00ms | +0.01ms | +161.58% |
| total | 0.21ms | 0.20ms | +0.01ms | +3.48% |

### registerRule

# Perf Report — registerRule.serial

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
| max | 0.01ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.48% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +43.22% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +243.43% |
| mean | 0.00ms | 0.00ms | +0.00ms | +32.74% |
| min | 0.00ms | 0.00ms | +0.00ms | +32.80% |
| max | 0.01ms | 0.01ms | +0.01ms | +62.37% |
| total | 0.08ms | 0.06ms | +0.02ms | +32.74% |

