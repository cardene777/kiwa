# Perf Suite — migration-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| apply_workflow (10 pending migrations + history) | 0.01ms | 0.03ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| diff_batch (5 diffSchema across schemas) | 0.03ms | 0.04ms | 100ms | 0.00042ms | PASS | regressed — gate 無効 (regressionGate=false) |
| down_error_handling (5 rollback of non-applied) | 0.0013ms | 0.0022ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| lock_acquire_release_batch (10 acquire-release cycle) | 0.0020ms | 0.0036ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| dryrun_dep_batch (5 plan + resolve) | 0.01ms | 0.03ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| apply_workflow (10 pending migrations + history) | 0.11ms | 200ms | PASS |
| diff_batch (5 diffSchema across schemas) | 0.10ms | 200ms | PASS |
| down_error_handling (5 rollback of non-applied) | 0.01ms | 200ms | PASS |
| lock_acquire_release_batch (10 acquire-release cycle) | 0.02ms | 200ms | PASS |
| dryrun_dep_batch (5 plan + resolve) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| apply_workflow (10 pending migrations + history) | -6456 B | -15016 B | 102400 B | yes | PASS |
| diff_batch (5 diffSchema across schemas) | 4152 B | 0 B | 102400 B | yes | PASS |
| down_error_handling (5 rollback of non-applied) | 2160 B | 0 B | 102400 B | yes | PASS |
| lock_acquire_release_batch (10 acquire-release cycle) | 1760 B | 0 B | 102400 B | yes | PASS |
| dryrun_dep_batch (5 plan + resolve) | 25712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### apply_workflow (10 pending migrations + history)

# Perf Report — apply_workflow (10 pending migrations + history).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0057ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00046ms | -3.17% |
| p50 | 0.02ms | 0.02ms | -0.00067ms | -3.14% |
| p95 | 0.03ms | 0.03ms | -0.0016ms | -4.88% |
| p99 | 0.03ms | 0.04ms | -0.0042ms | -10.95% |
| mean | 0.02ms | 0.02ms | -0.0022ms | -10.03% |
| min | 0.01ms | 0.01ms | +0.0017ms | +14.29% |
| max | 0.04ms | 0.04ms | -0.0049ms | -12.14% |
| total | 0.40ms | 0.45ms | -0.04ms | -10.03% |

### diff_batch (5 diffSchema across schemas)

# Perf Report — diff_batch (5 diffSchema across schemas).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.0046ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 0.68ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.02ms | +0.010ms | +50.97% |
| p50 | 0.03ms | 0.02ms | +0.01ms | +63.93% |
| p95 | 0.04ms | 0.03ms | +0.0058ms | +17.70% |
| p99 | 0.05ms | 0.03ms | +0.01ms | +40.05% |
| mean | 0.03ms | 0.02ms | +0.01ms | +47.64% |
| min | 0.03ms | 0.02ms | +0.0095ms | +50.21% |
| max | 0.05ms | 0.03ms | +0.02ms | +45.34% |
| total | 0.68ms | 0.46ms | +0.22ms | +47.64% |

### down_error_handling (5 rollback of non-applied)

# Perf Report — down_error_handling (5 rollback of non-applied).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0013ms |
| p50 | 0.0013ms |
| p95 | 0.0022ms |
| p99 | 0.0055ms |
| mean | 0.0017ms |
| stdev | 0.0011ms |
| min | 0.0013ms |
| max | 0.0064ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0013ms | 0.0013ms | -0.000043ms | -3.22% |
| p50 | 0.0013ms | 0.0014ms | -0.000083ms | -5.82% |
| p95 | 0.0022ms | 0.0023ms | -0.000074ms | -3.24% |
| p99 | 0.0055ms | 0.0061ms | -0.00058ms | -9.49% |
| mean | 0.0017ms | 0.0018ms | -0.000086ms | -4.86% |
| min | 0.0013ms | 0.0013ms | -0.000083ms | -6.23% |
| max | 0.0064ms | 0.0071ms | -0.00071ms | -10.00% |
| total | 0.03ms | 0.04ms | -0.0017ms | -4.86% |

### lock_acquire_release_batch (10 acquire-release cycle)

# Perf Report — lock_acquire_release_batch (10 acquire-release cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0020ms |
| p50 | 0.0020ms |
| p95 | 0.0036ms |
| p99 | 0.0038ms |
| mean | 0.0023ms |
| stdev | 0.00056ms |
| min | 0.0019ms |
| max | 0.0038ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0020ms | 0.0021ms | -0.00013ms | -6.20% |
| p50 | 0.0020ms | 0.0022ms | -0.00015ms | -6.74% |
| p95 | 0.0036ms | 0.0087ms | -0.0050ms | -58.15% |
| p99 | 0.0038ms | 0.04ms | -0.03ms | -90.12% |
| mean | 0.0023ms | 0.0049ms | -0.0026ms | -52.29% |
| min | 0.0019ms | 0.0020ms | -0.00012ms | -6.12% |
| max | 0.0038ms | 0.05ms | -0.04ms | -91.65% |
| total | 0.05ms | 0.10ms | -0.05ms | -52.29% |

### dryrun_dep_batch (5 plan + resolve)

# Perf Report — dryrun_dep_batch (5 plan + resolve).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.0069ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00010ms | +0.73% |
| p50 | 0.01ms | 0.01ms | -0.00019ms | -1.28% |
| p95 | 0.03ms | 0.03ms | +0.0014ms | +5.40% |
| p99 | 0.04ms | 0.03ms | +0.0090ms | +28.54% |
| mean | 0.02ms | 0.02ms | +0.00089ms | +5.56% |
| min | 0.01ms | 0.01ms | +0.0025ms | +21.87% |
| max | 0.04ms | 0.03ms | +0.01ms | +33.00% |
| total | 0.34ms | 0.32ms | +0.02ms | +5.56% |

