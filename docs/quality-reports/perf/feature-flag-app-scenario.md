# Perf Suite — feature-flag-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | 0.02ms | 100ms | PASS | stable |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 0.01ms | 100ms | PASS | stable |
| rule_error_handling (5 unknown flag + attribute mismatch) | 0.01ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | 0.06ms | 200ms | PASS |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 0.03ms | 200ms | PASS |
| rule_error_handling (5 unknown flag + attribute mismatch) | 0.02ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | 12728 B | 0 B | 102400 B | yes | PASS |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 19320 B | 0 B | 102400 B | yes | PASS |
| rule_error_handling (5 unknown flag + attribute mismatch) | 816 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluation_workflow (10 evaluateFlag across 4 providers)

# Perf Report — evaluation_workflow (10 evaluateFlag across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -2.45% |
| p95 | 0.02ms | 0.01ms | +0.00ms | +3.92% |
| p99 | 0.02ms | 0.01ms | +0.00ms | +20.14% |
| mean | 0.01ms | 0.01ms | +0.00ms | +6.25% |
| min | 0.01ms | 0.01ms | +0.00ms | +1.30% |
| max | 0.02ms | 0.01ms | +0.00ms | +24.16% |
| total | 0.17ms | 0.16ms | +0.01ms | +6.25% |

### all_flags_batch (5 evaluateAllFlags with 3 flags)

# Perf Report — all_flags_batch (5 evaluateAllFlags with 3 flags).serial

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
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -4.54% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -10.02% |
| p99 | 0.01ms | 0.02ms | -0.00ms | -19.67% |
| mean | 0.01ms | 0.01ms | -0.00ms | -9.81% |
| min | 0.01ms | 0.01ms | -0.00ms | -1.42% |
| max | 0.02ms | 0.02ms | -0.00ms | -21.47% |
| total | 0.14ms | 0.16ms | -0.02ms | -9.81% |

### rule_error_handling (5 unknown flag + attribute mismatch)

# Perf Report — rule_error_handling (5 unknown flag + attribute mismatch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -7.19% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -6.98% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -24.41% |
| mean | 0.00ms | 0.00ms | -0.00ms | -6.58% |
| min | 0.00ms | 0.00ms | -0.00ms | -5.14% |
| max | 0.01ms | 0.01ms | -0.00ms | -27.27% |
| total | 0.08ms | 0.09ms | -0.01ms | -6.58% |

