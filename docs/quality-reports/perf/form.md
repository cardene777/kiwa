# Perf Suite — form

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| validateSchema | 0.00ms | 5ms | PASS | stable |
| registerFieldAndSubmit | 0.02ms | 5ms | PASS | stable |
| getFieldErrorAfterFailure | 0.01ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| validateSchema | 0.01ms | 10ms | PASS |
| registerFieldAndSubmit | 0.08ms | 10ms | PASS |
| getFieldErrorAfterFailure | 0.06ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| validateSchema | -5096 B | 0 B | 102400 B | yes | PASS |
| registerFieldAndSubmit | -8984 B | 0 B | 102400 B | yes | PASS |
| getFieldErrorAfterFailure | 816 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -7.75% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +5.15% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -7.64% |
| mean | 0.00ms | 0.00ms | -0.00ms | -4.79% |
| min | 0.00ms | 0.00ms | -0.00ms | -8.40% |
| max | 0.01ms | 0.01ms | +0.00ms | +10.30% |
| total | 0.14ms | 0.15ms | -0.01ms | -4.79% |

### registerFieldAndSubmit

# Perf Report — registerFieldAndSubmit.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.14ms |
| total | 2.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +51.01% |
| p95 | 0.02ms | 0.01ms | +0.01ms | +51.42% |
| p99 | 0.03ms | 0.02ms | +0.01ms | +29.36% |
| mean | 0.01ms | 0.01ms | +0.00ms | +54.48% |
| min | 0.01ms | 0.01ms | -0.00ms | -5.15% |
| max | 0.14ms | 0.03ms | +0.11ms | +384.17% |
| total | 2.19ms | 1.42ms | +0.77ms | +54.48% |

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
| max | 0.04ms |
| total | 1.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -9.26% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +4.83% |
| p99 | 0.02ms | 0.01ms | +0.00ms | +34.43% |
| mean | 0.01ms | 0.01ms | -0.00ms | -3.36% |
| min | 0.00ms | 0.00ms | -0.00ms | -9.12% |
| max | 0.04ms | 0.02ms | +0.02ms | +77.97% |
| total | 1.04ms | 1.07ms | -0.04ms | -3.36% |

