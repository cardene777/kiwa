# Perf Suite — webhook-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | 3.21ms | 100ms | PASS | regressed — gate 無効 (regressionGate=false) |
| dispatch_retry_batch (5 handler retry with backoff) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +672%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| signature_reject_error (5 invalid signature detect) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +4057%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | 0.24ms | 200ms | PASS |
| dispatch_retry_batch (5 handler retry with backoff) | 0.08ms | 200ms | PASS |
| signature_reject_error (5 invalid signature detect) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | -2328 B | 0 B | 102400 B | yes | PASS |
| dispatch_retry_batch (5 handler retry with backoff) | 7336 B | 0 B | 102400 B | yes | PASS |
| signature_reject_error (5 invalid signature detect) | 6416 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### verify_workflow (10 verify across 4 providers)

# Perf Report — verify_workflow (10 verify across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.07ms |
| p95 | 3.21ms |
| p99 | 5.58ms |
| mean | 0.53ms |
| stdev | 1.49ms |
| min | 0.06ms |
| max | 6.18ms |
| total | 10.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.07ms | 0.07ms | +0.00ms | +4.13% |
| p95 | 3.21ms | 0.08ms | +3.13ms | +3801.67% |
| p99 | 5.58ms | 0.08ms | +5.50ms | +6605.36% |
| mean | 0.53ms | 0.07ms | +0.46ms | +683.30% |
| min | 0.06ms | 0.06ms | +0.00ms | +4.72% |
| max | 6.18ms | 0.08ms | +6.09ms | +7295.66% |
| total | 10.53ms | 1.34ms | +9.18ms | +683.30% |

### dispatch_retry_batch (5 handler retry with backoff)

# Perf Report — dispatch_retry_batch (5 handler retry with backoff).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -13.39% |
| p95 | 0.02ms | 0.07ms | -0.05ms | -73.27% |
| p99 | 0.03ms | 0.08ms | -0.05ms | -60.30% |
| mean | 0.02ms | 0.03ms | -0.01ms | -34.29% |
| min | 0.02ms | 0.02ms | -0.00ms | -12.20% |
| max | 0.03ms | 0.08ms | -0.05ms | -57.26% |
| total | 0.35ms | 0.53ms | -0.18ms | -34.29% |

### signature_reject_error (5 invalid signature detect)

# Perf Report — signature_reject_error (5 invalid signature detect).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.01ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -3.84% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -4.84% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -9.66% |
| mean | 0.01ms | 0.01ms | -0.00ms | -8.72% |
| min | 0.01ms | 0.01ms | -0.00ms | -3.81% |
| max | 0.01ms | 0.02ms | -0.00ms | -10.63% |
| total | 0.13ms | 0.14ms | -0.01ms | -8.72% |

