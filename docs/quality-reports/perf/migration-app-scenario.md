# Perf Suite — migration-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| apply_workflow (10 pending migrations + history) | 0.01ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| diff_batch (5 diffSchema across schemas) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| down_error_handling (5 rollback of non-applied) | 0.0011ms | 0.0027ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| lock_acquire_release_batch (10 acquire-release cycle) | 0.0018ms | 0.0033ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| dryrun_dep_batch (5 plan + resolve) | 0.01ms | 0.03ms | 100ms | 0.00050ms | PASS | stable (p10 -17% (閾値未満)、 p95 +31% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| apply_workflow (10 pending migrations + history) | 0.05ms | 200ms | PASS |
| diff_batch (5 diffSchema across schemas) | 0.08ms | 200ms | PASS |
| down_error_handling (5 rollback of non-applied) | 0.00ms | 200ms | PASS |
| lock_acquire_release_batch (10 acquire-release cycle) | 0.02ms | 200ms | PASS |
| dryrun_dep_batch (5 plan + resolve) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| apply_workflow (10 pending migrations + history) | -5440 B | 0 B | 102400 B | yes | PASS |
| diff_batch (5 diffSchema across schemas) | 43848 B | 0 B | 102400 B | yes | PASS |
| down_error_handling (5 rollback of non-applied) | 632 B | 0 B | 102400 B | yes | PASS |
| lock_acquire_release_batch (10 acquire-release cycle) | -248840 B | 0 B | 102400 B | yes | PASS |
| dryrun_dep_batch (5 plan + resolve) | 6176 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### apply_workflow (10 pending migrations + history)

# Perf Report — apply_workflow (10 pending migrations + history).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0057ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.0024ms | -16.42% |
| p50 | 0.01ms | 0.02ms | -0.0070ms | -32.81% |
| p95 | 0.03ms | 0.03ms | -0.0048ms | -15.14% |
| p99 | 0.03ms | 0.04ms | -0.0083ms | -21.40% |
| mean | 0.02ms | 0.02ms | -0.0052ms | -23.21% |
| min | 0.01ms | 0.01ms | -0.0020ms | -16.33% |
| max | 0.03ms | 0.04ms | -0.0092ms | -22.63% |
| total | 0.34ms | 0.45ms | -0.10ms | -23.21% |

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
| stdev | 0.0043ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0025ms | -12.70% |
| p50 | 0.02ms | 0.02ms | +0.00046ms | +2.29% |
| p95 | 0.03ms | 0.03ms | -0.0027ms | -8.16% |
| p99 | 0.03ms | 0.03ms | -0.0032ms | -9.39% |
| mean | 0.02ms | 0.02ms | -0.00097ms | -4.22% |
| min | 0.02ms | 0.02ms | -0.0020ms | -10.79% |
| max | 0.03ms | 0.03ms | -0.0033ms | -9.68% |
| total | 0.44ms | 0.46ms | -0.02ms | -4.22% |

### down_error_handling (5 rollback of non-applied)

# Perf Report — down_error_handling (5 rollback of non-applied).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0011ms |
| p50 | 0.0011ms |
| p95 | 0.0027ms |
| p99 | 0.02ms |
| mean | 0.0021ms |
| stdev | 0.0038ms |
| min | 0.0011ms |
| max | 0.02ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0011ms | 0.0013ms | -0.00025ms | -18.82% |
| p50 | 0.0011ms | 0.0014ms | -0.00029ms | -20.58% |
| p95 | 0.0027ms | 0.0023ms | +0.00040ms | +17.66% |
| p99 | 0.02ms | 0.0061ms | +0.0091ms | +148.27% |
| mean | 0.0021ms | 0.0018ms | +0.00033ms | +18.82% |
| min | 0.0011ms | 0.0013ms | -0.00025ms | -18.75% |
| max | 0.02ms | 0.0071ms | +0.01ms | +158.85% |
| total | 0.04ms | 0.04ms | +0.0066ms | +18.82% |

### lock_acquire_release_batch (10 acquire-release cycle)

# Perf Report — lock_acquire_release_batch (10 acquire-release cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0018ms |
| p50 | 0.0019ms |
| p95 | 0.0033ms |
| p99 | 0.0035ms |
| mean | 0.0022ms |
| stdev | 0.00050ms |
| min | 0.0018ms |
| max | 0.0035ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0018ms | 0.0021ms | -0.00025ms | -12.20% |
| p50 | 0.0019ms | 0.0022ms | -0.00025ms | -11.54% |
| p95 | 0.0033ms | 0.0087ms | -0.0053ms | -61.51% |
| p99 | 0.0035ms | 0.04ms | -0.03ms | -90.88% |
| mean | 0.0022ms | 0.0049ms | -0.0027ms | -55.84% |
| min | 0.0018ms | 0.0020ms | -0.00025ms | -12.20% |
| max | 0.0035ms | 0.05ms | -0.04ms | -92.29% |
| total | 0.04ms | 0.10ms | -0.05ms | -55.84% |

### dryrun_dep_batch (5 plan + resolve)

# Perf Report — dryrun_dep_batch (5 plan + resolve).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.13ms |
| mean | 0.02ms |
| stdev | 0.03ms |
| min | 0.01ms |
| max | 0.16ms |
| total | 0.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.0024ms | -16.94% |
| p50 | 0.01ms | 0.01ms | -0.0013ms | -8.94% |
| p95 | 0.03ms | 0.03ms | +0.0079ms | +30.86% |
| p99 | 0.13ms | 0.03ms | +0.10ms | +317.38% |
| mean | 0.02ms | 0.02ms | +0.0059ms | +36.83% |
| min | 0.01ms | 0.01ms | +0.000083ms | +0.71% |
| max | 0.16ms | 0.03ms | +0.12ms | +372.55% |
| total | 0.44ms | 0.32ms | +0.12ms | +36.83% |

