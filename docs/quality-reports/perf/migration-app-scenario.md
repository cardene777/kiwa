# Perf Suite — migration-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| apply_workflow (10 pending migrations + history) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| diff_batch (5 diffSchema across schemas) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| down_error_handling (5 rollback of non-applied) | 0.0011ms | 0.0040ms | 100ms | 0.00050ms | PASS | stable (p10 -16% (閾値未満)、 p95 +74% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| lock_acquire_release_batch (10 acquire-release cycle) | 0.0019ms | 0.0029ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| dryrun_dep_batch (5 plan + resolve) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| apply_workflow (10 pending migrations + history) | 0.05ms | 200ms | PASS |
| diff_batch (5 diffSchema across schemas) | 0.08ms | 200ms | PASS |
| down_error_handling (5 rollback of non-applied) | 0.01ms | 200ms | PASS |
| lock_acquire_release_batch (10 acquire-release cycle) | 0.02ms | 200ms | PASS |
| dryrun_dep_batch (5 plan + resolve) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| apply_workflow (10 pending migrations + history) | -6344 B | 0 B | 102400 B | yes | PASS |
| diff_batch (5 diffSchema across schemas) | 42416 B | 0 B | 102400 B | yes | PASS |
| down_error_handling (5 rollback of non-applied) | -392 B | 0 B | 102400 B | yes | PASS |
| lock_acquire_release_batch (10 acquire-release cycle) | 7808 B | 0 B | 102400 B | yes | PASS |
| dryrun_dep_batch (5 plan + resolve) | 5160 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### apply_workflow (10 pending migrations + history)

# Perf Report — apply_workflow (10 pending migrations + history).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0051ms |
| min | 0.0099ms |
| max | 0.03ms |
| total | 0.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.0022ms | -15.02% |
| p50 | 0.01ms | 0.02ms | -0.0069ms | -32.52% |
| p95 | 0.02ms | 0.03ms | -0.0092ms | -28.86% |
| p99 | 0.03ms | 0.04ms | -0.010ms | -25.72% |
| mean | 0.02ms | 0.02ms | -0.0060ms | -26.95% |
| min | 0.0099ms | 0.01ms | -0.0024ms | -19.39% |
| max | 0.03ms | 0.04ms | -0.01ms | -25.10% |
| total | 0.33ms | 0.45ms | -0.12ms | -26.95% |

### diff_batch (5 diffSchema across schemas)

# Perf Report — diff_batch (5 diffSchema across schemas).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0037ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00081ms | +4.13% |
| p50 | 0.02ms | 0.02ms | +0.0026ms | +12.78% |
| p95 | 0.03ms | 0.03ms | -0.0018ms | -5.62% |
| p99 | 0.03ms | 0.03ms | -0.0031ms | -9.10% |
| mean | 0.02ms | 0.02ms | +0.00083ms | +3.62% |
| min | 0.02ms | 0.02ms | +0.00054ms | +2.86% |
| max | 0.03ms | 0.03ms | -0.0034ms | -9.92% |
| total | 0.47ms | 0.46ms | +0.02ms | +3.62% |

### down_error_handling (5 rollback of non-applied)

# Perf Report — down_error_handling (5 rollback of non-applied).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0011ms |
| p50 | 0.0012ms |
| p95 | 0.0040ms |
| p99 | 0.0056ms |
| mean | 0.0017ms |
| stdev | 0.0012ms |
| min | 0.0011ms |
| max | 0.0060ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0011ms | 0.0013ms | -0.00021ms | -15.67% |
| p50 | 0.0012ms | 0.0014ms | -0.00023ms | -16.13% |
| p95 | 0.0040ms | 0.0023ms | +0.0017ms | +73.53% |
| p99 | 0.0056ms | 0.0061ms | -0.00056ms | -9.18% |
| mean | 0.0017ms | 0.0018ms | -0.000042ms | -2.37% |
| min | 0.0011ms | 0.0013ms | -0.00021ms | -15.60% |
| max | 0.0060ms | 0.0071ms | -0.0011ms | -15.87% |
| total | 0.03ms | 0.04ms | -0.00083ms | -2.37% |

### lock_acquire_release_batch (10 acquire-release cycle)

# Perf Report — lock_acquire_release_batch (10 acquire-release cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0019ms |
| p50 | 0.0021ms |
| p95 | 0.0029ms |
| p99 | 0.0036ms |
| mean | 0.0022ms |
| stdev | 0.00048ms |
| min | 0.0019ms |
| max | 0.0038ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0019ms | 0.0021ms | -0.00021ms | -9.99% |
| p50 | 0.0021ms | 0.0022ms | -0.00010ms | -4.82% |
| p95 | 0.0029ms | 0.0087ms | -0.0058ms | -66.80% |
| p99 | 0.0036ms | 0.04ms | -0.03ms | -90.51% |
| mean | 0.0022ms | 0.0049ms | -0.0027ms | -54.61% |
| min | 0.0019ms | 0.0020ms | -0.00017ms | -8.13% |
| max | 0.0038ms | 0.05ms | -0.04ms | -91.64% |
| total | 0.04ms | 0.10ms | -0.05ms | -54.61% |

### dryrun_dep_batch (5 plan + resolve)

# Perf Report — dryrun_dep_batch (5 plan + resolve).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0034ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.0030ms | -21.07% |
| p50 | 0.01ms | 0.01ms | -0.0033ms | -22.70% |
| p95 | 0.02ms | 0.03ms | -0.0056ms | -21.78% |
| p99 | 0.02ms | 0.03ms | -0.0095ms | -30.02% |
| mean | 0.01ms | 0.02ms | -0.0031ms | -19.16% |
| min | 0.01ms | 0.01ms | -0.00054ms | -4.66% |
| max | 0.02ms | 0.03ms | -0.01ms | -31.61% |
| total | 0.26ms | 0.32ms | -0.06ms | -19.16% |

