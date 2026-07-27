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
| registerFieldAndSubmit | 0.13ms | 10ms | PASS |
| getFieldErrorAfterFailure | 0.06ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| validateSchema | -9128 B | 0 B | 102400 B | yes | PASS |
| registerFieldAndSubmit | -8984 B | 0 B | 102400 B | yes | PASS |
| getFieldErrorAfterFailure | 1360 B | 0 B | 102400 B | yes | PASS |

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
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -22.40% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +36.93% |
| mean | 0.00ms | 0.00ms | -0.00ms | -2.95% |
| min | 0.00ms | 0.00ms | -0.00ms | -8.40% |
| max | 0.01ms | 0.01ms | -0.00ms | -19.39% |
| total | 0.14ms | 0.15ms | -0.00ms | -2.95% |

### registerFieldAndSubmit

# Perf Report — registerFieldAndSubmit.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.05ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.11ms |
| total | 1.87ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +2.70% |
| p95 | 0.02ms | 0.01ms | +0.00ms | +40.26% |
| p99 | 0.05ms | 0.02ms | +0.03ms | +125.31% |
| mean | 0.01ms | 0.01ms | +0.00ms | +31.78% |
| min | 0.01ms | 0.01ms | -0.00ms | -0.74% |
| max | 0.11ms | 0.03ms | +0.09ms | +309.10% |
| total | 1.87ms | 1.42ms | +0.45ms | +31.78% |

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
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.15ms |
| total | 1.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -10.93% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +11.39% |
| p99 | 0.02ms | 0.01ms | +0.01ms | +73.13% |
| mean | 0.01ms | 0.01ms | +0.00ms | +7.13% |
| min | 0.00ms | 0.00ms | -0.00ms | -9.10% |
| max | 0.15ms | 0.02ms | +0.12ms | +580.51% |
| total | 1.15ms | 1.07ms | +0.08ms | +7.13% |

