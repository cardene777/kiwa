# Perf Suite — feature-flag-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | 0.06ms | 100ms | PASS | stable (差 0.04ms が下限 0.5ms 未満で判定を保留) |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 0.02ms | 100ms | PASS | stable (差 0.01ms が下限 0.5ms 未満で判定を保留) |
| rule_error_handling (5 unknown flag + attribute mismatch) | 0.02ms | 100ms | PASS | stable (差 0.01ms が下限 0.5ms 未満で判定を保留) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | 0.20ms | 200ms | PASS |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 0.04ms | 200ms | PASS |
| rule_error_handling (5 unknown flag + attribute mismatch) | 0.12ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | 9536 B | -13064 B | 102400 B | yes | PASS |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 10368 B | 0 B | 102400 B | yes | PASS |
| rule_error_handling (5 unknown flag + attribute mismatch) | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluation_workflow (10 evaluateFlag across 4 providers)

# Perf Report — evaluation_workflow (10 evaluateFlag across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.06ms |
| p99 | 0.09ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.10ms |
| total | 0.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.01ms | +0.01ms | +126.53% |
| p95 | 0.06ms | 0.02ms | +0.04ms | +260.49% |
| p99 | 0.09ms | 0.02ms | +0.07ms | +410.86% |
| mean | 0.02ms | 0.01ms | +0.01ms | +144.87% |
| min | 0.01ms | 0.01ms | -0.00ms | -1.80% |
| max | 0.10ms | 0.02ms | +0.08ms | +443.97% |
| total | 0.44ms | 0.18ms | +0.26ms | +144.87% |

### all_flags_batch (5 evaluateAllFlags with 3 flags)

# Perf Report — all_flags_batch (5 evaluateAllFlags with 3 flags).serial

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
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.02ms | -0.01ms | -53.64% |
| p95 | 0.02ms | 0.03ms | -0.01ms | -48.08% |
| p99 | 0.02ms | 0.04ms | -0.02ms | -46.21% |
| mean | 0.01ms | 0.02ms | -0.01ms | -51.18% |
| min | 0.01ms | 0.02ms | -0.01ms | -51.73% |
| max | 0.02ms | 0.04ms | -0.02ms | -45.84% |
| total | 0.20ms | 0.41ms | -0.21ms | -51.18% |

### rule_error_handling (5 unknown flag + attribute mismatch)

# Perf Report — rule_error_handling (5 unknown flag + attribute mismatch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.03ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -3.54% |
| p95 | 0.02ms | 0.01ms | +0.01ms | +142.54% |
| p99 | 0.03ms | 0.01ms | +0.02ms | +229.34% |
| mean | 0.01ms | 0.00ms | +0.00ms | +76.57% |
| min | 0.00ms | 0.00ms | -0.00ms | -7.35% |
| max | 0.03ms | 0.01ms | +0.02ms | +246.03% |
| total | 0.15ms | 0.09ms | +0.07ms | +76.57% |

