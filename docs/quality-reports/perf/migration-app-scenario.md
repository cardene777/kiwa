# Perf Suite — migration-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| apply_workflow (10 pending migrations + history) | 0.02ms | 100ms | PASS | stable |
| diff_batch (5 diffSchema across schemas) | 0.03ms | 100ms | PASS | stable |
| down_error_handling (5 rollback of non-applied) | 0.00ms | 100ms | PASS | stable |
| lock_acquire_release_batch (10 acquire-release cycle) | 0.00ms | 100ms | PASS | stable |
| dryrun_dep_batch (5 plan + resolve) | 0.02ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| apply_workflow (10 pending migrations + history) | 0.04ms | 200ms | PASS |
| diff_batch (5 diffSchema across schemas) | 0.08ms | 200ms | PASS |
| down_error_handling (5 rollback of non-applied) | 0.01ms | 200ms | PASS |
| lock_acquire_release_batch (10 acquire-release cycle) | 0.01ms | 200ms | PASS |
| dryrun_dep_batch (5 plan + resolve) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| apply_workflow (10 pending migrations + history) | -7104 B | 0 B | 102400 B | yes | PASS |
| diff_batch (5 diffSchema across schemas) | 35616 B | 0 B | 102400 B | yes | PASS |
| down_error_handling (5 rollback of non-applied) | 832 B | 0 B | 102400 B | yes | PASS |
| lock_acquire_release_batch (10 acquire-release cycle) | 1288 B | 0 B | 102400 B | yes | PASS |
| dryrun_dep_batch (5 plan + resolve) | 6544 B | 0 B | 102400 B | yes | PASS |

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
| p50 | 0.01ms | 0.02ms | -0.00ms | -15.96% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +0.72% |
| p99 | 0.03ms | 0.03ms | -0.00ms | -6.83% |
| mean | 0.02ms | 0.02ms | -0.00ms | -9.39% |
| min | 0.01ms | 0.01ms | -0.00ms | -15.54% |
| max | 0.03ms | 0.03ms | -0.00ms | -8.19% |
| total | 0.32ms | 0.36ms | -0.03ms | -9.39% |

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
| total | 0.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -7.96% |
| p95 | 0.03ms | 0.03ms | +0.00ms | +1.87% |
| p99 | 0.03ms | 0.03ms | -0.00ms | -13.15% |
| mean | 0.02ms | 0.02ms | -0.00ms | -0.44% |
| min | 0.02ms | 0.02ms | -0.00ms | -1.89% |
| max | 0.03ms | 0.04ms | -0.01ms | -16.22% |
| total | 0.46ms | 0.46ms | -0.00ms | -0.44% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -1.80% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -7.89% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -12.56% |
| mean | 0.00ms | 0.00ms | -0.00ms | -5.22% |
| min | 0.00ms | 0.00ms | -0.00ms | -3.73% |
| max | 0.01ms | 0.01ms | -0.00ms | -12.97% |
| total | 0.03ms | 0.03ms | -0.00ms | -5.22% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +4.26% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +28.08% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +13.64% |
| mean | 0.00ms | 0.00ms | +0.00ms | +5.85% |
| min | 0.00ms | 0.00ms | +0.00ms | +2.19% |
| max | 0.00ms | 0.00ms | +0.00ms | +10.56% |
| total | 0.05ms | 0.04ms | +0.00ms | +5.85% |

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

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +0.17% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -14.24% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -9.69% |
| mean | 0.01ms | 0.01ms | -0.00ms | -2.99% |
| min | 0.01ms | 0.01ms | +0.00ms | +0.35% |
| max | 0.02ms | 0.02ms | -0.00ms | -8.57% |
| total | 0.26ms | 0.27ms | -0.01ms | -2.99% |

