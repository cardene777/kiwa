# Perf Suite — form

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| validateSchema | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +34292%) 以上の悪化が必要) |
| registerFieldAndSubmit | 0.01ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +3475%) 以上の悪化が必要) |
| getFieldErrorAfterFailure | 0.02ms | 5ms | PASS | stable (差 0.01ms が下限 0.5ms 未満で判定を保留) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| validateSchema | 0.01ms | 10ms | PASS |
| registerFieldAndSubmit | 0.09ms | 10ms | PASS |
| getFieldErrorAfterFailure | 0.07ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| validateSchema | -23080 B | 0 B | 102400 B | yes | PASS |
| registerFieldAndSubmit | -10296 B | 0 B | 102400 B | yes | PASS |
| getFieldErrorAfterFailure | 1864 B | 0 B | 102400 B | yes | PASS |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -11.79% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +8.92% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +47.52% |
| mean | 0.00ms | 0.00ms | -0.00ms | -7.27% |
| min | 0.00ms | 0.00ms | -0.00ms | -37.39% |
| max | 0.01ms | 0.01ms | -0.00ms | -6.70% |
| total | 0.15ms | 0.17ms | -0.01ms | -7.27% |

### registerFieldAndSubmit

# Perf Report — registerFieldAndSubmit.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.11ms |
| total | 1.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -21.27% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -16.81% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -18.74% |
| mean | 0.01ms | 0.01ms | -0.00ms | -16.37% |
| min | 0.01ms | 0.01ms | -0.00ms | -13.43% |
| max | 0.11ms | 0.03ms | +0.08ms | +269.76% |
| total | 1.39ms | 1.67ms | -0.27ms | -16.37% |

### getFieldErrorAfterFailure

# Perf Report — getFieldErrorAfterFailure.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.13ms |
| total | 1.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -14.83% |
| p95 | 0.02ms | 0.01ms | +0.01ms | +79.93% |
| p99 | 0.04ms | 0.03ms | +0.01ms | +49.76% |
| mean | 0.01ms | 0.01ms | +0.00ms | +14.70% |
| min | 0.00ms | 0.01ms | -0.00ms | -17.07% |
| max | 0.13ms | 0.08ms | +0.05ms | +62.13% |
| total | 1.57ms | 1.37ms | +0.20ms | +14.70% |

