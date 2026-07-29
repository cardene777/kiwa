# Perf Suite — migration-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| apply_workflow (10 pending migrations + history) | 0.01ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| diff_batch (5 diffSchema across schemas) | 0.02ms | 0.05ms | 100ms | 0.00050ms | PASS | stable (p10 +8% (閾値未満)、 p95 +58% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| down_error_handling (5 rollback of non-applied) | 0.0011ms | 0.0020ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| lock_acquire_release_batch (10 acquire-release cycle) | 0.0019ms | 0.0037ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| dryrun_dep_batch (5 plan + resolve) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| apply_workflow (10 pending migrations + history) | 0.05ms | 200ms | PASS |
| diff_batch (5 diffSchema across schemas) | 0.08ms | 200ms | PASS |
| down_error_handling (5 rollback of non-applied) | 0.00ms | 200ms | PASS |
| lock_acquire_release_batch (10 acquire-release cycle) | 0.02ms | 200ms | PASS |
| dryrun_dep_batch (5 plan + resolve) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| apply_workflow (10 pending migrations + history) | -6440 B | 0 B | 102400 B | yes | PASS |
| diff_batch (5 diffSchema across schemas) | 43696 B | 0 B | 102400 B | yes | PASS |
| down_error_handling (5 rollback of non-applied) | -392 B | 0 B | 102400 B | yes | PASS |
| lock_acquire_release_batch (10 acquire-release cycle) | 12560 B | 0 B | 102400 B | yes | PASS |
| dryrun_dep_batch (5 plan + resolve) | 4928 B | 0 B | 102400 B | yes | PASS |

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
| stdev | 0.0054ms |
| min | 0.010ms |
| max | 0.03ms |
| total | 0.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.0019ms | -13.19% |
| p50 | 0.01ms | 0.02ms | -0.0066ms | -31.34% |
| p95 | 0.03ms | 0.03ms | -0.0033ms | -10.29% |
| p99 | 0.03ms | 0.04ms | -0.0087ms | -22.42% |
| mean | 0.02ms | 0.02ms | -0.0059ms | -26.38% |
| min | 0.010ms | 0.01ms | -0.0023ms | -18.70% |
| max | 0.03ms | 0.04ms | -0.01ms | -24.80% |
| total | 0.33ms | 0.45ms | -0.12ms | -26.38% |

### diff_batch (5 diffSchema across schemas)

# Perf Report — diff_batch (5 diffSchema across schemas).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.05ms |
| p99 | 0.06ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.06ms |
| total | 0.63ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.0017ms | +8.44% |
| p50 | 0.02ms | 0.02ms | +0.0031ms | +15.28% |
| p95 | 0.05ms | 0.03ms | +0.02ms | +57.99% |
| p99 | 0.06ms | 0.03ms | +0.02ms | +64.19% |
| mean | 0.03ms | 0.02ms | +0.0087ms | +38.00% |
| min | 0.02ms | 0.02ms | +0.0019ms | +9.91% |
| max | 0.06ms | 0.03ms | +0.02ms | +65.65% |
| total | 0.63ms | 0.46ms | +0.17ms | +38.00% |

### down_error_handling (5 rollback of non-applied)

# Perf Report — down_error_handling (5 rollback of non-applied).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0011ms |
| p50 | 0.0011ms |
| p95 | 0.0020ms |
| p99 | 0.0046ms |
| mean | 0.0015ms |
| stdev | 0.00092ms |
| min | 0.0011ms |
| max | 0.0052ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0011ms | 0.0013ms | -0.00025ms | -18.82% |
| p50 | 0.0011ms | 0.0014ms | -0.00027ms | -19.13% |
| p95 | 0.0020ms | 0.0023ms | -0.00029ms | -12.70% |
| p99 | 0.0046ms | 0.0061ms | -0.0016ms | -25.43% |
| mean | 0.0015ms | 0.0018ms | -0.00031ms | -17.40% |
| min | 0.0011ms | 0.0013ms | -0.00025ms | -18.75% |
| max | 0.0052ms | 0.0071ms | -0.0019ms | -26.46% |
| total | 0.03ms | 0.04ms | -0.0061ms | -17.40% |

### lock_acquire_release_batch (10 acquire-release cycle)

# Perf Report — lock_acquire_release_batch (10 acquire-release cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0019ms |
| p50 | 0.0020ms |
| p95 | 0.0037ms |
| p99 | 0.0039ms |
| mean | 0.0023ms |
| stdev | 0.00060ms |
| min | 0.0019ms |
| max | 0.0040ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0019ms | 0.0021ms | -0.00017ms | -8.17% |
| p50 | 0.0020ms | 0.0022ms | -0.00021ms | -9.64% |
| p95 | 0.0037ms | 0.0087ms | -0.0050ms | -57.13% |
| p99 | 0.0039ms | 0.04ms | -0.03ms | -89.72% |
| mean | 0.0023ms | 0.0049ms | -0.0026ms | -53.68% |
| min | 0.0019ms | 0.0020ms | -0.00017ms | -8.13% |
| max | 0.0040ms | 0.05ms | -0.04ms | -91.28% |
| total | 0.05ms | 0.10ms | -0.05ms | -53.68% |

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
| stdev | 0.0035ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.0029ms | -20.19% |
| p50 | 0.01ms | 0.01ms | -0.0032ms | -21.84% |
| p95 | 0.02ms | 0.03ms | -0.0043ms | -17.00% |
| p99 | 0.02ms | 0.03ms | -0.0094ms | -29.78% |
| mean | 0.01ms | 0.02ms | -0.0030ms | -18.89% |
| min | 0.01ms | 0.01ms | -0.00038ms | -3.23% |
| max | 0.02ms | 0.03ms | -0.01ms | -32.24% |
| total | 0.26ms | 0.32ms | -0.06ms | -18.89% |

