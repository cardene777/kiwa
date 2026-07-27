# Perf Suite — migration-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| apply_workflow (10 pending migrations + history) | 0.02ms | 100ms | PASS | stable |
| diff_batch (5 diffSchema across schemas) | 0.03ms | 100ms | PASS | stable |
| down_error_handling (5 rollback of non-applied) | 0.00ms | 100ms | PASS | stable |
| lock_acquire_release_batch (10 acquire-release cycle) | 0.00ms | 100ms | PASS | n/a (baseline seeded) |
| dryrun_dep_batch (5 plan + resolve) | 0.02ms | 100ms | PASS | n/a (baseline seeded) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| apply_workflow (10 pending migrations + history) | 0.04ms | 200ms | PASS |
| diff_batch (5 diffSchema across schemas) | 0.23ms | 200ms | PASS |
| down_error_handling (5 rollback of non-applied) | 0.01ms | 200ms | PASS |
| lock_acquire_release_batch (10 acquire-release cycle) | 0.01ms | 200ms | PASS |
| dryrun_dep_batch (5 plan + resolve) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| apply_workflow (10 pending migrations + history) | 491344 B | 0 B | 102400 B | PASS |
| diff_batch (5 diffSchema across schemas) | 1435496 B | 0 B | 102400 B | PASS |
| down_error_handling (5 rollback of non-applied) | 53600 B | 0 B | 102400 B | PASS |
| lock_acquire_release_batch (10 acquire-release cycle) | 81544 B | 0 B | 102400 B | PASS |
| dryrun_dep_batch (5 plan + resolve) | 478200 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### apply_workflow (10 pending migrations + history)

# Perf Report — apply_workflow (10 pending migrations + history).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +1.77% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +1.87% |
| p99 | 0.03ms | 0.03ms | -0.00ms | -8.91% |
| mean | 0.02ms | 0.02ms | -0.00ms | -0.74% |
| min | 0.01ms | 0.01ms | +0.00ms | +0.39% |
| max | 0.03ms | 0.04ms | -0.00ms | -10.72% |
| total | 0.32ms | 0.32ms | -0.00ms | -0.74% |

### diff_batch (5 diffSchema across schemas)

# Perf Report — diff_batch (5 diffSchema across schemas).serial

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
| total | 0.45ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +16.65% |
| p95 | 0.03ms | 0.03ms | +0.00ms | +13.15% |
| p99 | 0.03ms | 0.04ms | -0.01ms | -16.32% |
| mean | 0.02ms | 0.02ms | +0.00ms | +7.41% |
| min | 0.02ms | 0.02ms | +0.00ms | +7.34% |
| max | 0.03ms | 0.04ms | -0.01ms | -21.24% |
| total | 0.45ms | 0.42ms | +0.03ms | +7.41% |

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
| max | 0.00ms |
| total | 0.02ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -7.66% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -31.02% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -13.33% |
| mean | 0.00ms | 0.00ms | -0.00ms | -15.19% |
| min | 0.00ms | 0.00ms | -0.00ms | -3.94% |
| max | 0.00ms | 0.01ms | -0.00ms | -11.19% |
| total | 0.02ms | 0.03ms | -0.00ms | -15.19% |

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
| total | 0.04ms |

### dryrun_dep_batch (5 plan + resolve)

# Perf Report — dryrun_dep_batch (5 plan + resolve).serial

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
| total | 0.26ms |

