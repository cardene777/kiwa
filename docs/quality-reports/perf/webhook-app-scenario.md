# Perf Suite — webhook-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | 0.07ms | 100ms | PASS | stable |
| dispatch_retry_batch (5 handler retry with backoff) | 0.02ms | 100ms | PASS | stable |
| signature_reject_error (5 invalid signature detect) | 0.01ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | 0.22ms | 200ms | PASS |
| dispatch_retry_batch (5 handler retry with backoff) | 0.07ms | 200ms | PASS |
| signature_reject_error (5 invalid signature detect) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | -4208 B | -62127 B | 102400 B | yes | PASS |
| dispatch_retry_batch (5 handler retry with backoff) | 1984 B | 0 B | 102400 B | yes | PASS |
| signature_reject_error (5 invalid signature detect) | 4152 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### verify_workflow (10 verify across 4 providers)

# Perf Report — verify_workflow (10 verify across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.06ms |
| p95 | 0.07ms |
| p99 | 0.10ms |
| mean | 0.06ms |
| stdev | 0.01ms |
| min | 0.05ms |
| max | 0.10ms |
| total | 1.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.06ms | 0.06ms | -0.00ms | -4.75% |
| p95 | 0.07ms | 0.07ms | -0.00ms | -0.71% |
| p99 | 0.10ms | 0.09ms | +0.01ms | +7.29% |
| mean | 0.06ms | 0.07ms | -0.00ms | -3.11% |
| min | 0.05ms | 0.05ms | -0.00ms | -4.81% |
| max | 0.10ms | 0.09ms | +0.01ms | +8.87% |
| total | 1.27ms | 1.31ms | -0.04ms | -3.11% |

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
| total | 0.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.01ms | +0.00ms | +31.85% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -1.88% |
| p99 | 0.03ms | 0.03ms | -0.00ms | -13.24% |
| mean | 0.02ms | 0.02ms | +0.00ms | +22.37% |
| min | 0.02ms | 0.01ms | +0.00ms | +14.03% |
| max | 0.03ms | 0.03ms | -0.01ms | -15.26% |
| total | 0.39ms | 0.32ms | +0.07ms | +22.37% |

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
| p50 | 0.01ms | 0.01ms | -0.00ms | -15.28% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +1.65% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -14.23% |
| mean | 0.01ms | 0.01ms | -0.00ms | -11.46% |
| min | 0.01ms | 0.01ms | -0.00ms | -11.88% |
| max | 0.01ms | 0.01ms | -0.00ms | -16.86% |
| total | 0.13ms | 0.14ms | -0.02ms | -11.46% |

