# Perf Suite — migration-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| apply_workflow (10 pending migrations + history) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| diff_batch (5 diffSchema across schemas) | 0.02ms | 0.04ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| down_error_handling (5 rollback of non-applied) | 0.0011ms | 0.0019ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| lock_acquire_release_batch (10 acquire-release cycle) | 0.0019ms | 0.0033ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| dryrun_dep_batch (5 plan + resolve) | 0.01ms | 0.06ms | 100ms | 0.00050ms | PASS | stable (p10 +2% (閾値未満)、 p95 +140% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| apply_workflow (10 pending migrations + history) | 0.08ms | 200ms | PASS |
| diff_batch (5 diffSchema across schemas) | 0.10ms | 200ms | PASS |
| down_error_handling (5 rollback of non-applied) | 0.01ms | 200ms | PASS |
| lock_acquire_release_batch (10 acquire-release cycle) | 0.02ms | 200ms | PASS |
| dryrun_dep_batch (5 plan + resolve) | 1.45ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| apply_workflow (10 pending migrations + history) | 16896 B | -15017 B | 102400 B | yes | PASS |
| diff_batch (5 diffSchema across schemas) | -184 B | 0 B | 102400 B | yes | PASS |
| down_error_handling (5 rollback of non-applied) | 632 B | 0 B | 102400 B | yes | PASS |
| lock_acquire_release_batch (10 acquire-release cycle) | 14672 B | 0 B | 102400 B | yes | PASS |
| dryrun_dep_batch (5 plan + resolve) | 944 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### apply_workflow (10 pending migrations + history)

# Perf Report — apply_workflow (10 pending migrations + history).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.0052ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.45ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.01ms | +0.0057ms | +39.34% |
| p50 | 0.02ms | 0.02ms | -0.00048ms | -2.26% |
| p95 | 0.03ms | 0.03ms | -0.0039ms | -12.40% |
| p99 | 0.04ms | 0.04ms | +0.0013ms | +3.47% |
| mean | 0.02ms | 0.02ms | +0.00023ms | +1.02% |
| min | 0.02ms | 0.01ms | +0.0079ms | +64.29% |
| max | 0.04ms | 0.04ms | +0.0027ms | +6.58% |
| total | 0.45ms | 0.45ms | +0.0045ms | +1.02% |

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
| mean | 0.03ms |
| stdev | 0.0063ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.0017ms | +8.57% |
| p50 | 0.02ms | 0.02ms | +0.0031ms | +15.70% |
| p95 | 0.04ms | 0.03ms | +0.0060ms | +18.32% |
| p99 | 0.04ms | 0.03ms | +0.0094ms | +27.46% |
| mean | 0.03ms | 0.02ms | +0.0032ms | +14.18% |
| min | 0.02ms | 0.02ms | +0.0020ms | +10.79% |
| max | 0.04ms | 0.03ms | +0.01ms | +29.62% |
| total | 0.52ms | 0.46ms | +0.06ms | +14.18% |

### down_error_handling (5 rollback of non-applied)

# Perf Report — down_error_handling (5 rollback of non-applied).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0011ms |
| p50 | 0.0011ms |
| p95 | 0.0019ms |
| p99 | 0.0048ms |
| mean | 0.0014ms |
| stdev | 0.00098ms |
| min | 0.0011ms |
| max | 0.0055ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0011ms | 0.0013ms | -0.00025ms | -18.82% |
| p50 | 0.0011ms | 0.0014ms | -0.00029ms | -20.58% |
| p95 | 0.0019ms | 0.0023ms | -0.00044ms | -18.99% |
| p99 | 0.0048ms | 0.0061ms | -0.0014ms | -22.10% |
| mean | 0.0014ms | 0.0018ms | -0.00034ms | -19.53% |
| min | 0.0011ms | 0.0013ms | -0.00025ms | -18.75% |
| max | 0.0055ms | 0.0071ms | -0.0016ms | -22.35% |
| total | 0.03ms | 0.04ms | -0.0069ms | -19.53% |

### lock_acquire_release_batch (10 acquire-release cycle)

# Perf Report — lock_acquire_release_batch (10 acquire-release cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0019ms |
| p50 | 0.0020ms |
| p95 | 0.0033ms |
| p99 | 0.0036ms |
| mean | 0.0022ms |
| stdev | 0.00051ms |
| min | 0.0019ms |
| max | 0.0037ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0019ms | 0.0021ms | -0.00017ms | -8.02% |
| p50 | 0.0020ms | 0.0022ms | -0.00021ms | -9.64% |
| p95 | 0.0033ms | 0.0087ms | -0.0054ms | -61.84% |
| p99 | 0.0036ms | 0.04ms | -0.03ms | -90.46% |
| mean | 0.0022ms | 0.0049ms | -0.0027ms | -54.45% |
| min | 0.0019ms | 0.0020ms | -0.00017ms | -8.13% |
| max | 0.0037ms | 0.05ms | -0.04ms | -91.83% |
| total | 0.04ms | 0.10ms | -0.05ms | -54.45% |

### dryrun_dep_batch (5 plan + resolve)

# Perf Report — dryrun_dep_batch (5 plan + resolve).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.06ms |
| p99 | 0.15ms |
| mean | 0.03ms |
| stdev | 0.04ms |
| min | 0.01ms |
| max | 0.17ms |
| total | 0.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00023ms | +1.65% |
| p50 | 0.02ms | 0.01ms | +0.00067ms | +4.54% |
| p95 | 0.06ms | 0.03ms | +0.04ms | +140.30% |
| p99 | 0.15ms | 0.03ms | +0.12ms | +382.26% |
| mean | 0.03ms | 0.02ms | +0.01ms | +80.55% |
| min | 0.01ms | 0.01ms | +0.0027ms | +22.93% |
| max | 0.17ms | 0.03ms | +0.14ms | +428.85% |
| total | 0.58ms | 0.32ms | +0.26ms | +80.55% |

