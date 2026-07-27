# Perf Suite — form

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| validateSchema | 0.00ms | 5ms | PASS | stable |
| registerFieldAndSubmit | 0.01ms | 5ms | PASS | improved |
| getFieldErrorAfterFailure | 0.01ms | 5ms | PASS | improved |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| validateSchema | 0.01ms | 10ms | PASS |
| registerFieldAndSubmit | 0.09ms | 10ms | PASS |
| getFieldErrorAfterFailure | 0.08ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| validateSchema | 659256 B | 0 B | 102400 B | PASS |
| registerFieldAndSubmit | -6078536 B | 0 B | 102400 B | PASS |
| getFieldErrorAfterFailure | 2279184 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### validateSchema

# Perf Report — validateSchema.serial

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
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -16.67% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +9.10% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +26.24% |
| mean | 0.00ms | 0.00ms | -0.00ms | -14.06% |
| min | 0.00ms | 0.00ms | -0.00ms | -35.31% |
| max | 0.01ms | 0.01ms | +0.00ms | +9.41% |
| total | 0.15ms | 0.17ms | -0.02ms | -14.06% |

### registerFieldAndSubmit

# Perf Report — registerFieldAndSubmit.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.17ms |
| total | 1.65ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.01ms | -55.79% |
| p95 | 0.01ms | 0.03ms | -0.02ms | -55.72% |
| p99 | 0.03ms | 0.08ms | -0.05ms | -62.22% |
| mean | 0.01ms | 0.02ms | -0.01ms | -55.14% |
| min | 0.01ms | 0.01ms | -0.00ms | -18.02% |
| max | 0.17ms | 0.40ms | -0.23ms | -57.72% |
| total | 1.65ms | 3.69ms | -2.03ms | -55.14% |

### getFieldErrorAfterFailure

# Perf Report — getFieldErrorAfterFailure.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 1.00ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.01ms | -0.00ms | -40.34% |
| p95 | 0.01ms | 0.02ms | -0.01ms | -55.75% |
| p99 | 0.02ms | 0.03ms | -0.01ms | -36.08% |
| mean | 0.01ms | 0.01ms | -0.01ms | -50.28% |
| min | 0.00ms | 0.01ms | -0.00ms | -23.84% |
| max | 0.02ms | 0.08ms | -0.06ms | -74.69% |
| total | 1.00ms | 2.02ms | -1.01ms | -50.28% |

