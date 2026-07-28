# Perf Suite — webhook-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | 0.08ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +608%) 以上の悪化が必要) |
| dispatch_retry_batch (5 handler retry with backoff) | 0.03ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +672%) 以上の悪化が必要) |
| signature_reject_error (5 invalid signature detect) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +4057%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | 0.32ms | 200ms | PASS |
| dispatch_retry_batch (5 handler retry with backoff) | 0.08ms | 200ms | PASS |
| signature_reject_error (5 invalid signature detect) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | -2048 B | -63669 B | 102400 B | yes | PASS |
| dispatch_retry_batch (5 handler retry with backoff) | 96 B | 0 B | 102400 B | yes | PASS |
| signature_reject_error (5 invalid signature detect) | 776 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### verify_workflow (10 verify across 4 providers)

# Perf Report — verify_workflow (10 verify across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.06ms |
| p95 | 0.08ms |
| p99 | 0.10ms |
| mean | 0.06ms |
| stdev | 0.01ms |
| min | 0.05ms |
| max | 0.10ms |
| total | 1.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.06ms | 0.07ms | -0.01ms | -8.61% |
| p95 | 0.08ms | 0.08ms | -0.00ms | -5.97% |
| p99 | 0.10ms | 0.08ms | +0.02ms | +19.32% |
| mean | 0.06ms | 0.07ms | -0.00ms | -6.55% |
| min | 0.05ms | 0.06ms | -0.01ms | -11.56% |
| max | 0.10ms | 0.08ms | +0.02ms | +25.55% |
| total | 1.26ms | 1.34ms | -0.09ms | -6.55% |

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
| max | 0.03ms |
| total | 0.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -9.55% |
| p95 | 0.03ms | 0.07ms | -0.04ms | -55.79% |
| p99 | 0.03ms | 0.08ms | -0.04ms | -57.06% |
| mean | 0.02ms | 0.03ms | -0.01ms | -26.81% |
| min | 0.02ms | 0.02ms | -0.00ms | -10.53% |
| max | 0.03ms | 0.08ms | -0.05ms | -57.36% |
| total | 0.39ms | 0.53ms | -0.14ms | -26.81% |

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
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -7.67% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +21.62% |
| p99 | 0.02ms | 0.01ms | +0.00ms | +22.22% |
| mean | 0.01ms | 0.01ms | +0.00ms | +1.32% |
| min | 0.01ms | 0.01ms | -0.00ms | -7.62% |
| max | 0.02ms | 0.02ms | +0.00ms | +22.34% |
| total | 0.15ms | 0.14ms | +0.00ms | +1.32% |

