# Perf Suite — migration-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| apply_workflow (10 pending migrations + history) | 0.03ms | 100ms | PASS | stable |
| diff_batch (5 diffSchema across schemas) | 0.04ms | 100ms | PASS | stable |
| down_error_handling (5 rollback of non-applied) | 0.00ms | 100ms | PASS | stable |
| lock_acquire_release_batch (10 acquire-release cycle) | 0.00ms | 100ms | PASS | stable |
| dryrun_dep_batch (5 plan + resolve) | 0.02ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| apply_workflow (10 pending migrations + history) | 0.05ms | 200ms | PASS |
| diff_batch (5 diffSchema across schemas) | 0.09ms | 200ms | PASS |
| down_error_handling (5 rollback of non-applied) | 0.01ms | 200ms | PASS |
| lock_acquire_release_batch (10 acquire-release cycle) | 0.01ms | 200ms | PASS |
| dryrun_dep_batch (5 plan + resolve) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| apply_workflow (10 pending migrations + history) | -5768 B | 0 B | 102400 B | yes | PASS |
| diff_batch (5 diffSchema across schemas) | 50096 B | 0 B | 102400 B | yes | PASS |
| down_error_handling (5 rollback of non-applied) | -14064 B | 0 B | 102400 B | yes | PASS |
| lock_acquire_release_batch (10 acquire-release cycle) | 1384 B | 0 B | 102400 B | yes | PASS |
| dryrun_dep_batch (5 plan + resolve) | 6640 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### apply_workflow (10 pending migrations + history)

# Perf Report — apply_workflow (10 pending migrations + history).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +15.45% |
| p95 | 0.03ms | 0.02ms | +0.00ms | +17.91% |
| p99 | 0.04ms | 0.03ms | +0.01ms | +26.46% |
| mean | 0.02ms | 0.02ms | +0.00ms | +12.93% |
| min | 0.01ms | 0.01ms | -0.00ms | -1.35% |
| max | 0.04ms | 0.03ms | +0.01ms | +28.00% |
| total | 0.40ms | 0.36ms | +0.05ms | +12.93% |

### diff_batch (5 diffSchema across schemas)

# Perf Report — diff_batch (5 diffSchema across schemas).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.02ms | +0.00ms | +11.22% |
| p95 | 0.04ms | 0.03ms | +0.01ms | +33.29% |
| p99 | 0.04ms | 0.03ms | +0.01ms | +20.38% |
| mean | 0.03ms | 0.02ms | +0.00ms | +19.14% |
| min | 0.02ms | 0.02ms | +0.01ms | +33.57% |
| max | 0.04ms | 0.04ms | +0.01ms | +17.74% |
| total | 0.55ms | 0.46ms | +0.09ms | +19.14% |

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
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -1.80% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -2.40% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -15.42% |
| mean | 0.00ms | 0.00ms | -0.00ms | -3.76% |
| min | 0.00ms | 0.00ms | -0.00ms | -3.73% |
| max | 0.00ms | 0.01ms | -0.00ms | -16.54% |
| total | 0.03ms | 0.03ms | -0.00ms | -3.76% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +14.91% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +21.69% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +14.47% |
| mean | 0.00ms | 0.00ms | +0.00ms | +14.91% |
| min | 0.00ms | 0.00ms | +0.00ms | +13.33% |
| max | 0.00ms | 0.00ms | +0.00ms | +12.93% |
| total | 0.05ms | 0.04ms | +0.01ms | +14.91% |

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
| p50 | 0.01ms | 0.01ms | +0.00ms | +3.78% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -9.93% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -3.39% |
| mean | 0.01ms | 0.01ms | +0.00ms | +1.54% |
| min | 0.01ms | 0.01ms | +0.00ms | +3.51% |
| max | 0.02ms | 0.02ms | -0.00ms | -1.78% |
| total | 0.27ms | 0.27ms | +0.00ms | +1.54% |

