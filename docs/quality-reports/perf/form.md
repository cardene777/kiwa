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
| validateSchema | 0.03ms | 10ms | PASS |
| registerFieldAndSubmit | 0.13ms | 10ms | PASS |
| getFieldErrorAfterFailure | 0.08ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| validateSchema | -8648 B | 0 B | 102400 B | yes | PASS |
| registerFieldAndSubmit | 5472 B | 0 B | 102400 B | yes | PASS |
| getFieldErrorAfterFailure | 640 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### validateSchema

# Perf Report — validateSchema.serial

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
| max | 0.03ms |
| total | 0.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +192.16% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +90.56% |
| p99 | 0.01ms | 0.00ms | +0.01ms | +167.97% |
| mean | 0.00ms | 0.00ms | +0.00ms | +148.94% |
| min | 0.00ms | 0.00ms | +0.00ms | +125.00% |
| max | 0.03ms | 0.01ms | +0.03ms | +370.91% |
| total | 0.37ms | 0.15ms | +0.22ms | +148.94% |

### registerFieldAndSubmit

# Perf Report — registerFieldAndSubmit.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 1.74ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +10.12% |
| p95 | 0.02ms | 0.01ms | +0.00ms | +21.99% |
| p99 | 0.02ms | 0.02ms | -0.01ms | -21.27% |
| mean | 0.01ms | 0.01ms | +0.00ms | +22.99% |
| min | 0.01ms | 0.01ms | +0.00ms | +7.36% |
| max | 0.03ms | 0.03ms | +0.00ms | +1.94% |
| total | 1.74ms | 1.42ms | +0.33ms | +22.99% |

### getFieldErrorAfterFailure

# Perf Report — getFieldErrorAfterFailure.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.09ms |
| total | 1.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.00ms | +0.00ms | +3.35% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +22.55% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -1.82% |
| mean | 0.01ms | 0.01ms | +0.00ms | +10.33% |
| min | 0.00ms | 0.00ms | +0.00ms | +3.62% |
| max | 0.09ms | 0.02ms | +0.07ms | +343.66% |
| total | 1.18ms | 1.07ms | +0.11ms | +10.33% |

