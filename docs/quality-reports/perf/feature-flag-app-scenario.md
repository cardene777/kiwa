# Perf Suite — feature-flag-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | 0.03ms | 100ms | PASS | stable |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 0.02ms | 100ms | PASS | stable |
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
| evaluation_workflow (10 evaluateFlag across 4 providers) | 15768 B | 0 B | 102400 B | yes | PASS |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 19104 B | 0 B | 102400 B | yes | PASS |
| rule_error_handling (5 unknown flag + attribute mismatch) | -512 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluation_workflow (10 evaluateFlag across 4 providers)

# Perf Report — evaluation_workflow (10 evaluateFlag across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.06ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.07ms |
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +15.03% |
| p95 | 0.03ms | 0.01ms | +0.02ms | +109.27% |
| p99 | 0.06ms | 0.01ms | +0.05ms | +317.14% |
| mean | 0.01ms | 0.01ms | +0.01ms | +75.86% |
| min | 0.01ms | 0.01ms | +0.00ms | +3.26% |
| max | 0.07ms | 0.01ms | +0.05ms | +368.55% |
| total | 0.27ms | 0.16ms | +0.12ms | +75.86% |

### all_flags_batch (5 evaluateAllFlags with 3 flags)

# Perf Report — all_flags_batch (5 evaluateAllFlags with 3 flags).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +20.91% |
| p95 | 0.02ms | 0.01ms | +0.00ms | +14.23% |
| p99 | 0.03ms | 0.02ms | +0.01ms | +38.44% |
| mean | 0.01ms | 0.01ms | +0.00ms | +30.24% |
| min | 0.01ms | 0.01ms | +0.00ms | +30.00% |
| max | 0.03ms | 0.02ms | +0.01ms | +42.95% |
| total | 0.21ms | 0.16ms | +0.05ms | +30.24% |

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
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +3.00% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +38.51% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +14.22% |
| mean | 0.00ms | 0.00ms | +0.00ms | +13.07% |
| min | 0.00ms | 0.00ms | +0.00ms | +5.14% |
| max | 0.01ms | 0.01ms | +0.00ms | +10.23% |
| total | 0.10ms | 0.09ms | +0.01ms | +13.07% |

