# Perf Suite — migration-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| apply_workflow (10 pending migrations + history) | 0.04ms | 100ms | PASS | stable |
| diff_batch (5 diffSchema across schemas) | 0.05ms | 100ms | PASS | stable |
| down_error_handling (5 rollback of non-applied) | 0.00ms | 100ms | PASS | stable |
| lock_acquire_release_batch (10 acquire-release cycle) | 0.00ms | 100ms | PASS | stable |
| dryrun_dep_batch (5 plan + resolve) | 0.03ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| apply_workflow (10 pending migrations + history) | 0.06ms | 200ms | PASS |
| diff_batch (5 diffSchema across schemas) | 0.10ms | 200ms | PASS |
| down_error_handling (5 rollback of non-applied) | 0.01ms | 200ms | PASS |
| lock_acquire_release_batch (10 acquire-release cycle) | 0.01ms | 200ms | PASS |
| dryrun_dep_batch (5 plan + resolve) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| apply_workflow (10 pending migrations + history) | 8568 B | 0 B | 102400 B | yes | PASS |
| diff_batch (5 diffSchema across schemas) | 8312 B | 0 B | 102400 B | yes | PASS |
| down_error_handling (5 rollback of non-applied) | -4464 B | 0 B | 102400 B | yes | PASS |
| lock_acquire_release_batch (10 acquire-release cycle) | 12728 B | 0 B | 102400 B | yes | PASS |
| dryrun_dep_batch (5 plan + resolve) | 6592 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### apply_workflow (10 pending migrations + history)

# Perf Report — apply_workflow (10 pending migrations + history).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.05ms |
| total | 0.48ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.01ms | +37.55% |
| p95 | 0.04ms | 0.02ms | +0.01ms | +46.49% |
| p99 | 0.04ms | 0.03ms | +0.01ms | +35.17% |
| mean | 0.02ms | 0.02ms | +0.01ms | +34.32% |
| min | 0.02ms | 0.01ms | +0.00ms | +29.06% |
| max | 0.05ms | 0.03ms | +0.01ms | +33.13% |
| total | 0.48ms | 0.36ms | +0.12ms | +34.32% |

### diff_batch (5 diffSchema across schemas)

# Perf Report — diff_batch (5 diffSchema across schemas).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 0.70ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.02ms | +0.01ms | +55.38% |
| p95 | 0.05ms | 0.03ms | +0.02ms | +69.27% |
| p99 | 0.05ms | 0.03ms | +0.02ms | +44.34% |
| mean | 0.03ms | 0.02ms | +0.01ms | +51.90% |
| min | 0.03ms | 0.02ms | +0.01ms | +43.02% |
| max | 0.05ms | 0.04ms | +0.01ms | +39.25% |
| total | 0.70ms | 0.46ms | +0.24ms | +51.90% |

### down_error_handling (5 rollback of non-applied)

# Perf Report — down_error_handling (5 rollback of non-applied).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +21.43% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +12.73% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -6.29% |
| mean | 0.00ms | 0.00ms | +0.00ms | +15.64% |
| min | 0.00ms | 0.00ms | +0.00ms | +18.49% |
| max | 0.01ms | 0.01ms | -0.00ms | -7.92% |
| total | 0.03ms | 0.03ms | +0.00ms | +15.64% |

### lock_acquire_release_batch (10 acquire-release cycle)

# Perf Report — lock_acquire_release_batch (10 acquire-release cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.00ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +6.38% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +24.09% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +11.99% |
| mean | 0.00ms | 0.00ms | +0.00ms | +9.25% |
| min | 0.00ms | 0.00ms | +0.00ms | +4.43% |
| max | 0.00ms | 0.00ms | +0.00ms | +9.40% |
| total | 0.05ms | 0.04ms | +0.00ms | +9.25% |

### dryrun_dep_batch (5 plan + resolve)

# Perf Report — dryrun_dep_batch (5 plan + resolve).serial

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
| total | 0.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.01ms | +0.01ms | +43.81% |
| p95 | 0.03ms | 0.02ms | +0.00ms | +18.62% |
| p99 | 0.03ms | 0.02ms | +0.00ms | +19.73% |
| mean | 0.02ms | 0.01ms | +0.01ms | +38.01% |
| min | 0.02ms | 0.01ms | +0.01ms | +43.16% |
| max | 0.03ms | 0.02ms | +0.00ms | +20.00% |
| total | 0.37ms | 0.27ms | +0.10ms | +38.01% |

