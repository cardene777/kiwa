# Perf Suite — webhook-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | 0.31ms | 100ms | PASS | stable |
| dispatch_retry_batch (5 handler retry with backoff) | 0.03ms | 100ms | PASS | stable |
| signature_reject_error (5 invalid signature detect) | 0.01ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | 0.58ms | 200ms | PASS |
| dispatch_retry_batch (5 handler retry with backoff) | 0.16ms | 200ms | PASS |
| signature_reject_error (5 invalid signature detect) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | 1528 B | 0 B | 102400 B | yes | PASS |
| dispatch_retry_batch (5 handler retry with backoff) | 296 B | 0 B | 102400 B | yes | PASS |
| signature_reject_error (5 invalid signature detect) | 4360 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### verify_workflow (10 verify across 4 providers)

# Perf Report — verify_workflow (10 verify across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.17ms |
| p95 | 0.31ms |
| p99 | 0.38ms |
| mean | 0.17ms |
| stdev | 0.08ms |
| min | 0.06ms |
| max | 0.40ms |
| total | 3.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.17ms | 0.06ms | +0.11ms | +167.68% |
| p95 | 0.31ms | 0.07ms | +0.23ms | +308.97% |
| p99 | 0.38ms | 0.09ms | +0.29ms | +315.12% |
| mean | 0.17ms | 0.07ms | +0.10ms | +156.49% |
| min | 0.06ms | 0.05ms | +0.01ms | +9.77% |
| max | 0.40ms | 0.09ms | +0.30ms | +316.34% |
| total | 3.37ms | 1.31ms | +2.05ms | +156.49% |

### dispatch_retry_batch (5 handler retry with backoff)

# Perf Report — dispatch_retry_batch (5 handler retry with backoff).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.01ms | +0.01ms | +41.36% |
| p95 | 0.03ms | 0.02ms | +0.01ms | +30.86% |
| p99 | 0.04ms | 0.03ms | +0.01ms | +17.91% |
| mean | 0.02ms | 0.02ms | +0.01ms | +44.07% |
| min | 0.02ms | 0.01ms | +0.00ms | +34.33% |
| max | 0.04ms | 0.03ms | +0.01ms | +15.62% |
| total | 0.46ms | 0.32ms | +0.14ms | +44.07% |

### signature_reject_error (5 invalid signature detect)

# Perf Report — signature_reject_error (5 invalid signature detect).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -2.22% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +50.17% |
| p99 | 0.02ms | 0.01ms | +0.00ms | +21.08% |
| mean | 0.01ms | 0.01ms | +0.00ms | +10.22% |
| min | 0.01ms | 0.01ms | +0.00ms | +4.20% |
| max | 0.02ms | 0.01ms | +0.00ms | +16.28% |
| total | 0.16ms | 0.14ms | +0.01ms | +10.22% |

