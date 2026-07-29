# Perf Suite — migration-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| apply_workflow (10 pending migrations + history) | 0.03ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1746%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| diff_batch (5 diffSchema across schemas) | 0.05ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1519%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| down_error_handling (5 rollback of non-applied) | 0.00ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +24775%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| lock_acquire_release_batch (10 acquire-release cycle) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +14210%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| dryrun_dep_batch (5 plan + resolve) | 0.03ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +2532%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| apply_workflow (10 pending migrations + history) | 0.06ms | 200ms | PASS |
| diff_batch (5 diffSchema across schemas) | 0.09ms | 200ms | PASS |
| down_error_handling (5 rollback of non-applied) | 0.01ms | 200ms | PASS |
| lock_acquire_release_batch (10 acquire-release cycle) | 0.02ms | 200ms | PASS |
| dryrun_dep_batch (5 plan + resolve) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| apply_workflow (10 pending migrations + history) | -3032 B | 0 B | 102400 B | yes | PASS |
| diff_batch (5 diffSchema across schemas) | 616 B | 0 B | 102400 B | yes | PASS |
| down_error_handling (5 rollback of non-applied) | -3512 B | 0 B | 102400 B | yes | PASS |
| lock_acquire_release_batch (10 acquire-release cycle) | 7000 B | 0 B | 102400 B | yes | PASS |
| dryrun_dep_batch (5 plan + resolve) | 3688 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### apply_workflow (10 pending migrations + history)

# Perf Report — apply_workflow (10 pending migrations + history).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.05ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.05ms |
| total | 0.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.01ms | +0.01ms | +42.11% |
| p95 | 0.03ms | 0.03ms | -0.00ms | -4.03% |
| p99 | 0.05ms | 0.04ms | +0.01ms | +21.07% |
| mean | 0.02ms | 0.02ms | +0.00ms | +20.80% |
| min | 0.01ms | 0.01ms | +0.00ms | +15.13% |
| max | 0.05ms | 0.04ms | +0.01ms | +25.58% |
| total | 0.42ms | 0.35ms | +0.07ms | +20.80% |

### diff_batch (5 diffSchema across schemas)

# Perf Report — diff_batch (5 diffSchema across schemas).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.05ms |
| p99 | 0.09ms |
| mean | 0.04ms |
| stdev | 0.02ms |
| min | 0.03ms |
| max | 0.10ms |
| total | 0.72ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.02ms | +0.01ms | +67.97% |
| p95 | 0.05ms | 0.03ms | +0.02ms | +61.03% |
| p99 | 0.09ms | 0.04ms | +0.05ms | +107.10% |
| mean | 0.04ms | 0.02ms | +0.01ms | +61.12% |
| min | 0.03ms | 0.02ms | +0.01ms | +68.13% |
| max | 0.10ms | 0.05ms | +0.05ms | +115.16% |
| total | 0.72ms | 0.45ms | +0.27ms | +61.12% |

### down_error_handling (5 rollback of non-applied)

# Perf Report — down_error_handling (5 rollback of non-applied).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +5.54% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +9.73% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +0.10% |
| mean | 0.00ms | 0.00ms | +0.00ms | +5.19% |
| min | 0.00ms | 0.00ms | +0.00ms | +7.38% |
| max | 0.01ms | 0.01ms | -0.00ms | -0.66% |
| total | 0.03ms | 0.03ms | +0.00ms | +5.19% |

### lock_acquire_release_batch (10 acquire-release cycle)

# Perf Report — lock_acquire_release_batch (10 acquire-release cycle).serial

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
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +10.51% |
| p95 | 0.01ms | 0.00ms | +0.00ms | +45.29% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +79.36% |
| mean | 0.00ms | 0.00ms | +0.00ms | +16.51% |
| min | 0.00ms | 0.00ms | +0.00ms | +8.91% |
| max | 0.01ms | 0.00ms | +0.00ms | +87.10% |
| total | 0.05ms | 0.05ms | +0.01ms | +16.51% |

### dryrun_dep_batch (5 plan + resolve)

# Perf Report — dryrun_dep_batch (5 plan + resolve).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +15.62% |
| p95 | 0.03ms | 0.02ms | +0.01ms | +33.18% |
| p99 | 0.03ms | 0.02ms | +0.01ms | +29.07% |
| mean | 0.02ms | 0.01ms | +0.00ms | +22.78% |
| min | 0.01ms | 0.01ms | +0.00ms | +15.44% |
| max | 0.03ms | 0.02ms | +0.01ms | +28.12% |
| total | 0.31ms | 0.25ms | +0.06ms | +22.78% |

