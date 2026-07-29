# Perf Suite — feature-flag-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +3237%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 0.01ms | 100ms | PASS | stable (差 0.02ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| rule_error_handling (5 unknown flag + attribute mismatch) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +6525%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | 0.08ms | 200ms | PASS |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 0.04ms | 200ms | PASS |
| rule_error_handling (5 unknown flag + attribute mismatch) | 0.02ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | 8432 B | -13094 B | 102400 B | yes | PASS |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 41000 B | 0 B | 102400 B | yes | PASS |
| rule_error_handling (5 unknown flag + attribute mismatch) | 7040 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluation_workflow (10 evaluateFlag across 4 providers)

# Perf Report — evaluation_workflow (10 evaluateFlag across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.11ms |
| mean | 0.02ms |
| stdev | 0.03ms |
| min | 0.01ms |
| max | 0.13ms |
| total | 0.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +41.06% |
| p95 | 0.02ms | 0.02ms | +0.01ms | +47.78% |
| p99 | 0.11ms | 0.02ms | +0.09ms | +531.74% |
| mean | 0.02ms | 0.01ms | +0.01ms | +89.80% |
| min | 0.01ms | 0.01ms | +0.00ms | +46.11% |
| max | 0.13ms | 0.02ms | +0.11ms | +638.27% |
| total | 0.34ms | 0.18ms | +0.16ms | +89.80% |

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
| max | 0.01ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.02ms | -0.01ms | -53.18% |
| p95 | 0.01ms | 0.03ms | -0.02ms | -57.07% |
| p99 | 0.01ms | 0.04ms | -0.02ms | -62.03% |
| mean | 0.01ms | 0.02ms | -0.01ms | -55.17% |
| min | 0.01ms | 0.02ms | -0.01ms | -52.53% |
| max | 0.01ms | 0.04ms | -0.02ms | -63.03% |
| total | 0.18ms | 0.41ms | -0.23ms | -55.17% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -0.59% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -3.05% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -13.12% |
| mean | 0.00ms | 0.00ms | -0.00ms | -5.61% |
| min | 0.00ms | 0.00ms | -0.00ms | -3.69% |
| max | 0.01ms | 0.01ms | -0.00ms | -15.06% |
| total | 0.08ms | 0.09ms | -0.00ms | -5.61% |

