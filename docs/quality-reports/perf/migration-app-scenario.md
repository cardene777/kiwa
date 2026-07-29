# Perf Suite — migration-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| apply_workflow (10 pending migrations + history) | 0.01ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| diff_batch (5 diffSchema across schemas) | 0.02ms | 0.04ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| down_error_handling (5 rollback of non-applied) | 0.0011ms | 0.0057ms | 100ms | 0.00050ms | PASS | stable (p10 -16% (閾値未満)、 p95 +149% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| lock_acquire_release_batch (10 acquire-release cycle) | 0.0019ms | 0.0035ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| dryrun_dep_batch (5 plan + resolve) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| apply_workflow (10 pending migrations + history) | 0.05ms | 200ms | PASS |
| diff_batch (5 diffSchema across schemas) | 0.09ms | 200ms | PASS |
| down_error_handling (5 rollback of non-applied) | 0.01ms | 200ms | PASS |
| lock_acquire_release_batch (10 acquire-release cycle) | 0.02ms | 200ms | PASS |
| dryrun_dep_batch (5 plan + resolve) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| apply_workflow (10 pending migrations + history) | -5616 B | 0 B | 102400 B | yes | PASS |
| diff_batch (5 diffSchema across schemas) | 616 B | 0 B | 102400 B | yes | PASS |
| down_error_handling (5 rollback of non-applied) | 632 B | 0 B | 102400 B | yes | PASS |
| lock_acquire_release_batch (10 acquire-release cycle) | 7904 B | 0 B | 102400 B | yes | PASS |
| dryrun_dep_batch (5 plan + resolve) | 5160 B | 0 B | 102400 B | yes | PASS |

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
| stdev | 0.0055ms |
| min | 0.0098ms |
| max | 0.03ms |
| total | 0.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.0019ms | -12.73% |
| p50 | 0.02ms | 0.02ms | -0.0059ms | -27.60% |
| p95 | 0.03ms | 0.03ms | -0.0049ms | -15.42% |
| p99 | 0.03ms | 0.04ms | -0.0072ms | -18.70% |
| mean | 0.02ms | 0.02ms | -0.0055ms | -24.86% |
| min | 0.0098ms | 0.01ms | -0.0025ms | -20.07% |
| max | 0.03ms | 0.04ms | -0.0078ms | -19.34% |
| total | 0.33ms | 0.45ms | -0.11ms | -24.86% |

### diff_batch (5 diffSchema across schemas)

# Perf Report — diff_batch (5 diffSchema across schemas).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.0051ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.0010ms | +5.16% |
| p50 | 0.02ms | 0.02ms | +0.0028ms | +14.03% |
| p95 | 0.04ms | 0.03ms | +0.0034ms | +10.37% |
| p99 | 0.04ms | 0.03ms | +0.0022ms | +6.48% |
| mean | 0.02ms | 0.02ms | +0.0016ms | +7.07% |
| min | 0.02ms | 0.02ms | +0.0010ms | +5.28% |
| max | 0.04ms | 0.03ms | +0.0019ms | +5.56% |
| total | 0.49ms | 0.46ms | +0.03ms | +7.07% |

### down_error_handling (5 rollback of non-applied)

# Perf Report — down_error_handling (5 rollback of non-applied).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0011ms |
| p50 | 0.0012ms |
| p95 | 0.0057ms |
| p99 | 0.0075ms |
| mean | 0.0018ms |
| stdev | 0.0018ms |
| min | 0.0011ms |
| max | 0.0080ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0011ms | 0.0013ms | -0.00021ms | -15.67% |
| p50 | 0.0012ms | 0.0014ms | -0.00023ms | -16.17% |
| p95 | 0.0057ms | 0.0023ms | +0.0034ms | +148.69% |
| p99 | 0.0075ms | 0.0061ms | +0.0014ms | +22.58% |
| mean | 0.0018ms | 0.0018ms | +0.000062ms | +3.55% |
| min | 0.0011ms | 0.0013ms | -0.00021ms | -15.60% |
| max | 0.0080ms | 0.0071ms | +0.00088ms | +12.37% |
| total | 0.04ms | 0.04ms | +0.0012ms | +3.55% |

### lock_acquire_release_batch (10 acquire-release cycle)

# Perf Report — lock_acquire_release_batch (10 acquire-release cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0019ms |
| p50 | 0.0019ms |
| p95 | 0.0035ms |
| p99 | 0.0042ms |
| mean | 0.0023ms |
| stdev | 0.00067ms |
| min | 0.0018ms |
| max | 0.0044ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0019ms | 0.0021ms | -0.00021ms | -10.19% |
| p50 | 0.0019ms | 0.0022ms | -0.00023ms | -10.59% |
| p95 | 0.0035ms | 0.0087ms | -0.0052ms | -59.63% |
| p99 | 0.0042ms | 0.04ms | -0.03ms | -88.96% |
| mean | 0.0023ms | 0.0049ms | -0.0026ms | -52.79% |
| min | 0.0018ms | 0.0020ms | -0.00021ms | -10.19% |
| max | 0.0044ms | 0.05ms | -0.04ms | -90.36% |
| total | 0.05ms | 0.10ms | -0.05ms | -52.79% |

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
| stdev | 0.0038ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.0026ms | -18.71% |
| p50 | 0.01ms | 0.01ms | -0.0029ms | -19.72% |
| p95 | 0.02ms | 0.03ms | -0.0041ms | -16.00% |
| p99 | 0.02ms | 0.03ms | -0.0084ms | -26.66% |
| mean | 0.01ms | 0.02ms | -0.0025ms | -15.70% |
| min | 0.01ms | 0.01ms | -0.00017ms | -1.44% |
| max | 0.02ms | 0.03ms | -0.0095ms | -28.72% |
| total | 0.27ms | 0.32ms | -0.05ms | -15.70% |

