# Perf Suite — webhook-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | 0.09ms | 100ms | PASS | stable |
| dispatch_retry_batch (5 handler retry with backoff) | 0.03ms | 100ms | PASS | stable |
| signature_reject_error (5 invalid signature detect) | 0.01ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | 0.27ms | 200ms | PASS |
| dispatch_retry_batch (5 handler retry with backoff) | 0.08ms | 200ms | PASS |
| signature_reject_error (5 invalid signature detect) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | 757536 B | 16384 B | 102400 B | PASS |
| dispatch_retry_batch (5 handler retry with backoff) | 415552 B | 0 B | 102400 B | PASS |
| signature_reject_error (5 invalid signature detect) | 119872 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### verify_workflow (10 verify across 4 providers)

# Perf Report — verify_workflow (10 verify across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.06ms |
| p95 | 0.09ms |
| p99 | 0.10ms |
| mean | 0.07ms |
| stdev | 0.01ms |
| min | 0.05ms |
| max | 0.10ms |
| total | 1.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.06ms | 0.06ms | +0.00ms | +5.03% |
| p95 | 0.09ms | 0.09ms | -0.01ms | -6.91% |
| p99 | 0.10ms | 0.23ms | -0.13ms | -56.98% |
| mean | 0.07ms | 0.07ms | -0.01ms | -8.15% |
| min | 0.05ms | 0.05ms | +0.00ms | +1.76% |
| max | 0.10ms | 0.27ms | -0.16ms | -61.33% |
| total | 1.32ms | 1.44ms | -0.12ms | -8.15% |

### dispatch_retry_batch (5 handler retry with backoff)

# Perf Report — dispatch_retry_batch (5 handler retry with backoff).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +4.64% |
| p95 | 0.03ms | 0.03ms | +0.00ms | +6.91% |
| p99 | 0.03ms | 0.03ms | +0.00ms | +16.68% |
| mean | 0.02ms | 0.02ms | +0.00ms | +8.70% |
| min | 0.02ms | 0.01ms | +0.00ms | +2.79% |
| max | 0.03ms | 0.03ms | +0.01ms | +18.90% |
| total | 0.39ms | 0.36ms | +0.03ms | +8.70% |

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
| min | 0.00ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -20.32% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +24.17% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +27.73% |
| mean | 0.01ms | 0.01ms | -0.00ms | -3.65% |
| min | 0.00ms | 0.00ms | +0.00ms | +7.40% |
| max | 0.01ms | 0.01ms | +0.00ms | +28.56% |
| total | 0.12ms | 0.13ms | -0.00ms | -3.65% |

