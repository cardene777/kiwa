# Perf Suite — webhook-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | 0.08ms | 100ms | PASS | stable |
| dispatch_retry_batch (5 handler retry with backoff) | 0.03ms | 100ms | PASS | stable |
| signature_reject_error (5 invalid signature detect) | 0.01ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | 0.21ms | 200ms | PASS |
| dispatch_retry_batch (5 handler retry with backoff) | 0.09ms | 200ms | PASS |
| signature_reject_error (5 invalid signature detect) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | -2416 B | 0 B | 102400 B | yes | PASS |
| dispatch_retry_batch (5 handler retry with backoff) | 2048 B | 0 B | 102400 B | yes | PASS |
| signature_reject_error (5 invalid signature detect) | 11000 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### verify_workflow (10 verify across 4 providers)

# Perf Report — verify_workflow (10 verify across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.06ms |
| p95 | 0.08ms |
| p99 | 0.12ms |
| mean | 0.07ms |
| stdev | 0.02ms |
| min | 0.05ms |
| max | 0.13ms |
| total | 1.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.06ms | 0.06ms | -0.00ms | -2.97% |
| p95 | 0.08ms | 0.07ms | +0.01ms | +7.56% |
| p99 | 0.12ms | 0.09ms | +0.03ms | +35.99% |
| mean | 0.07ms | 0.07ms | +0.00ms | +1.42% |
| min | 0.05ms | 0.05ms | +0.00ms | +1.01% |
| max | 0.13ms | 0.09ms | +0.04ms | +41.59% |
| total | 1.33ms | 1.31ms | +0.02ms | +1.42% |

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
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.01ms | +0.00ms | +16.00% |
| p95 | 0.03ms | 0.02ms | +0.00ms | +15.05% |
| p99 | 0.03ms | 0.03ms | +0.00ms | +2.47% |
| mean | 0.02ms | 0.02ms | +0.00ms | +17.92% |
| min | 0.02ms | 0.01ms | +0.00ms | +8.66% |
| max | 0.04ms | 0.03ms | +0.00ms | +0.24% |
| total | 0.38ms | 0.32ms | +0.06ms | +17.92% |

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
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -8.28% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +33.68% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -2.21% |
| mean | 0.01ms | 0.01ms | -0.00ms | -3.82% |
| min | 0.01ms | 0.01ms | -0.00ms | -9.10% |
| max | 0.01ms | 0.01ms | -0.00ms | -8.14% |
| total | 0.14ms | 0.14ms | -0.01ms | -3.82% |

