# Perf Suite — migration-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| apply_workflow (10 pending migrations + history) | 0.01ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| diff_batch (5 diffSchema across schemas) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| down_error_handling (5 rollback of non-applied) | 0.0011ms | 0.0021ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| lock_acquire_release_batch (10 acquire-release cycle) | 0.0019ms | 0.0033ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| dryrun_dep_batch (5 plan + resolve) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| apply_workflow (10 pending migrations + history) | 0.06ms | 200ms | PASS |
| diff_batch (5 diffSchema across schemas) | 0.10ms | 200ms | PASS |
| down_error_handling (5 rollback of non-applied) | 0.00ms | 200ms | PASS |
| lock_acquire_release_batch (10 acquire-release cycle) | 0.02ms | 200ms | PASS |
| dryrun_dep_batch (5 plan + resolve) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| apply_workflow (10 pending migrations + history) | -6056 B | 0 B | 102400 B | yes | PASS |
| diff_batch (5 diffSchema across schemas) | 41536 B | 0 B | 102400 B | yes | PASS |
| down_error_handling (5 rollback of non-applied) | -776 B | 0 B | 102400 B | yes | PASS |
| lock_acquire_release_batch (10 acquire-release cycle) | 7456 B | 0 B | 102400 B | yes | PASS |
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
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.0066ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.0023ms | -15.45% |
| p50 | 0.02ms | 0.02ms | -0.0059ms | -27.90% |
| p95 | 0.03ms | 0.03ms | -0.0016ms | -5.01% |
| p99 | 0.04ms | 0.04ms | -0.0036ms | -9.34% |
| mean | 0.02ms | 0.02ms | -0.0042ms | -18.83% |
| min | 0.01ms | 0.01ms | -0.00071ms | -5.79% |
| max | 0.04ms | 0.04ms | -0.0041ms | -10.19% |
| total | 0.36ms | 0.45ms | -0.08ms | -18.83% |

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
| stdev | 0.0051ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00089ms | -4.53% |
| p50 | 0.02ms | 0.02ms | +0.0031ms | +15.49% |
| p95 | 0.03ms | 0.03ms | +0.0014ms | +4.32% |
| p99 | 0.03ms | 0.03ms | +0.000014ms | +0.04% |
| mean | 0.02ms | 0.02ms | +0.0018ms | +7.84% |
| min | 0.02ms | 0.02ms | -0.00079ms | -4.19% |
| max | 0.03ms | 0.03ms | -0.00033ms | -0.97% |
| total | 0.49ms | 0.46ms | +0.04ms | +7.84% |

### down_error_handling (5 rollback of non-applied)

# Perf Report — down_error_handling (5 rollback of non-applied).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0011ms |
| p50 | 0.0011ms |
| p95 | 0.0021ms |
| p99 | 0.0041ms |
| mean | 0.0014ms |
| stdev | 0.00079ms |
| min | 0.0011ms |
| max | 0.0046ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0011ms | 0.0013ms | -0.00025ms | -18.82% |
| p50 | 0.0011ms | 0.0014ms | -0.00029ms | -20.58% |
| p95 | 0.0021ms | 0.0023ms | -0.00016ms | -7.15% |
| p99 | 0.0041ms | 0.0061ms | -0.0020ms | -33.19% |
| mean | 0.0014ms | 0.0018ms | -0.00038ms | -21.66% |
| min | 0.0011ms | 0.0013ms | -0.00025ms | -18.75% |
| max | 0.0046ms | 0.0071ms | -0.0025ms | -35.30% |
| total | 0.03ms | 0.04ms | -0.0076ms | -21.66% |

### lock_acquire_release_batch (10 acquire-release cycle)

# Perf Report — lock_acquire_release_batch (10 acquire-release cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0019ms |
| p50 | 0.0019ms |
| p95 | 0.0033ms |
| p99 | 0.0036ms |
| mean | 0.0022ms |
| stdev | 0.00050ms |
| min | 0.0019ms |
| max | 0.0037ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0019ms | 0.0021ms | -0.00021ms | -9.99% |
| p50 | 0.0019ms | 0.0022ms | -0.00023ms | -10.57% |
| p95 | 0.0033ms | 0.0087ms | -0.0054ms | -62.32% |
| p99 | 0.0036ms | 0.04ms | -0.03ms | -90.57% |
| mean | 0.0022ms | 0.0049ms | -0.0027ms | -54.74% |
| min | 0.0019ms | 0.0020ms | -0.00017ms | -8.13% |
| max | 0.0037ms | 0.05ms | -0.04ms | -91.92% |
| total | 0.04ms | 0.10ms | -0.05ms | -54.74% |

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
| stdev | 0.0031ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.0029ms | -20.45% |
| p50 | 0.01ms | 0.01ms | -0.0032ms | -21.84% |
| p95 | 0.02ms | 0.03ms | -0.0039ms | -15.46% |
| p99 | 0.02ms | 0.03ms | -0.010ms | -31.64% |
| mean | 0.01ms | 0.02ms | -0.0034ms | -21.04% |
| min | 0.01ms | 0.01ms | -0.00042ms | -3.59% |
| max | 0.02ms | 0.03ms | -0.01ms | -34.76% |
| total | 0.25ms | 0.32ms | -0.07ms | -21.04% |

