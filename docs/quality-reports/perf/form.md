# Perf Suite — form

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| validateSchema | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +34292%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| registerFieldAndSubmit | 0.01ms | 5ms | PASS | stable (差 0.00ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| getFieldErrorAfterFailure | 0.01ms | 5ms | PASS | stable (差 0.00ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| validateSchema | 0.01ms | 10ms | PASS |
| registerFieldAndSubmit | 0.10ms | 10ms | PASS |
| getFieldErrorAfterFailure | 0.06ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| validateSchema | -2808 B | 0 B | 102400 B | yes | PASS |
| registerFieldAndSubmit | -19088 B | 0 B | 102400 B | yes | PASS |
| getFieldErrorAfterFailure | 12736 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.07% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +11.73% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +20.96% |
| mean | 0.00ms | 0.00ms | +0.00ms | +8.93% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +65.37% |
| total | 0.18ms | 0.17ms | +0.01ms | +8.93% |

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
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 1.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -4.61% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -27.82% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -12.78% |
| mean | 0.01ms | 0.01ms | -0.00ms | -10.81% |
| min | 0.01ms | 0.01ms | +0.00ms | +4.01% |
| max | 0.02ms | 0.03ms | -0.01ms | -21.42% |
| total | 1.49ms | 1.67ms | -0.18ms | -10.81% |

### getFieldErrorAfterFailure

# Perf Report — getFieldErrorAfterFailure.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.09ms |
| total | 1.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -14.48% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +47.99% |
| p99 | 0.02ms | 0.03ms | -0.01ms | -36.86% |
| mean | 0.01ms | 0.01ms | -0.00ms | -4.13% |
| min | 0.00ms | 0.01ms | -0.00ms | -11.38% |
| max | 0.09ms | 0.08ms | +0.01ms | +12.56% |
| total | 1.31ms | 1.37ms | -0.06ms | -4.13% |

