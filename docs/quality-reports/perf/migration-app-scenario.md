# Perf Suite — migration-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| apply_workflow (10 pending migrations + history) | 0.03ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1746%) 以上の悪化が必要) |
| diff_batch (5 diffSchema across schemas) | 0.04ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1519%) 以上の悪化が必要) |
| down_error_handling (5 rollback of non-applied) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +24775%) 以上の悪化が必要) |
| lock_acquire_release_batch (10 acquire-release cycle) | 0.00ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +14210%) 以上の悪化が必要) |
| dryrun_dep_batch (5 plan + resolve) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +2532%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| apply_workflow (10 pending migrations + history) | 0.04ms | 200ms | PASS |
| diff_batch (5 diffSchema across schemas) | 0.09ms | 200ms | PASS |
| down_error_handling (5 rollback of non-applied) | 0.01ms | 200ms | PASS |
| lock_acquire_release_batch (10 acquire-release cycle) | 0.19ms | 200ms | PASS |
| dryrun_dep_batch (5 plan + resolve) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| apply_workflow (10 pending migrations + history) | -6208 B | 0 B | 102400 B | yes | PASS |
| diff_batch (5 diffSchema across schemas) | -536 B | 0 B | 102400 B | yes | PASS |
| down_error_handling (5 rollback of non-applied) | 1488 B | 0 B | 102400 B | yes | PASS |
| lock_acquire_release_batch (10 acquire-release cycle) | -9896 B | 0 B | 102400 B | yes | PASS |
| dryrun_dep_batch (5 plan + resolve) | 6344 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### apply_workflow (10 pending migrations + history)

# Perf Report — apply_workflow (10 pending migrations + history).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -0.29% |
| p95 | 0.03ms | 0.03ms | -0.00ms | -0.86% |
| p99 | 0.03ms | 0.04ms | -0.01ms | -15.62% |
| mean | 0.02ms | 0.02ms | +0.00ms | +0.06% |
| min | 0.01ms | 0.01ms | -0.00ms | -1.97% |
| max | 0.03ms | 0.04ms | -0.01ms | -18.27% |
| total | 0.35ms | 0.35ms | +0.00ms | +0.06% |

### diff_batch (5 diffSchema across schemas)

# Perf Report — diff_batch (5 diffSchema across schemas).serial

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
| max | 0.04ms |
| total | 0.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +17.19% |
| p95 | 0.04ms | 0.03ms | +0.00ms | +8.74% |
| p99 | 0.04ms | 0.04ms | -0.01ms | -16.35% |
| mean | 0.02ms | 0.02ms | +0.00ms | +8.29% |
| min | 0.02ms | 0.02ms | +0.00ms | +7.78% |
| max | 0.04ms | 0.05ms | -0.01ms | -20.74% |
| total | 0.49ms | 0.45ms | +0.04ms | +8.29% |

### down_error_handling (5 rollback of non-applied)

# Perf Report — down_error_handling (5 rollback of non-applied).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.05ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.06ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +5.46% |
| p95 | 0.01ms | 0.00ms | +0.01ms | +632.81% |
| p99 | 0.05ms | 0.01ms | +0.04ms | +783.31% |
| mean | 0.01ms | 0.00ms | +0.00ms | +246.55% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.06ms | 0.01ms | +0.05ms | +795.30% |
| total | 0.10ms | 0.03ms | +0.07ms | +246.55% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +1.04% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -2.24% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -0.41% |
| mean | 0.00ms | 0.00ms | -0.00ms | -1.62% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| total | 0.05ms | 0.05ms | -0.00ms | -1.62% |

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
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +4.67% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +5.69% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +8.36% |
| mean | 0.01ms | 0.01ms | +0.00ms | +7.34% |
| min | 0.01ms | 0.01ms | +0.00ms | +4.78% |
| max | 0.02ms | 0.02ms | +0.00ms | +8.98% |
| total | 0.27ms | 0.25ms | +0.02ms | +7.34% |

