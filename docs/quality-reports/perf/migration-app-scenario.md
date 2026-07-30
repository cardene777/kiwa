# Perf Suite — migration-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| apply_workflow (10 pending migrations + history) | 0.01ms | 0.03ms | 100ms | 0.00042ms | PASS | stable (換算後 p10 -1% (閾値未満)、 p95 +32% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| diff_batch (5 diffSchema across schemas) | 0.02ms | 0.03ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| down_error_handling (5 rollback of non-applied) | 0.00088ms | 0.0028ms | 100ms | 0.00044ms | PASS | stable (換算後 p10 -7% (閾値未満)、 p95 +58% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| lock_acquire_release_batch (10 acquire-release cycle) | 0.0013ms | 0.0059ms | 100ms | 0.00045ms | PASS | improved — gate 無効 (regressionGate=false) |
| dryrun_dep_batch (5 plan + resolve) | 0.01ms | 0.02ms | 100ms | 0.00046ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| apply_workflow (10 pending migrations + history) | cpu | 0.08ms | 0.09ms | 0.01ms | 0.127 | 0.128 | 0.01ms | 0.01ms |
| diff_batch (5 diffSchema across schemas) | cpu | 0.08ms | 0.09ms | 0.02ms | 0.223 | 0.216 | 0.02ms | 0.02ms |
| down_error_handling (5 rollback of non-applied) | cpu | 0.08ms | 0.08ms | 0.00088ms | 0.011 | 0.011 | 0.00093ms | 0.0010ms |
| lock_acquire_release_batch (10 acquire-release cycle) | cpu | 0.08ms | 0.08ms | 0.0013ms | 0.016 | 0.024 | 0.0014ms | 0.0021ms |
| dryrun_dep_batch (5 plan + resolve) | cpu | 0.08ms | 0.09ms | 0.01ms | 0.133 | 0.135 | 0.01ms | 0.01ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| apply_workflow (10 pending migrations + history) | 0.04ms | 200ms | PASS |
| diff_batch (5 diffSchema across schemas) | 0.09ms | 200ms | PASS |
| down_error_handling (5 rollback of non-applied) | 0.01ms | 200ms | PASS |
| lock_acquire_release_batch (10 acquire-release cycle) | 0.01ms | 200ms | PASS |
| dryrun_dep_batch (5 plan + resolve) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| apply_workflow (10 pending migrations + history) | -6360 B | 0 B | 102400 B | yes | PASS |
| diff_batch (5 diffSchema across schemas) | 744 B | 0 B | 102400 B | yes | PASS |
| down_error_handling (5 rollback of non-applied) | 664 B | 0 B | 102400 B | yes | PASS |
| lock_acquire_release_batch (10 acquire-release cycle) | 4496 B | 0 B | 102400 B | yes | PASS |
| dryrun_dep_batch (5 plan + resolve) | 6264 B | 0 B | 102400 B | yes | PASS |

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
| mean | 0.01ms |
| stdev | 0.0061ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.29ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.012)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.000085ms | -0.81% |
| p50 | 0.01ms | 0.01ms | -0.00025ms | -1.85% |
| p95 | 0.03ms | 0.02ms | +0.0075ms | +31.57% |
| p99 | 0.03ms | 0.03ms | +0.0019ms | +6.38% |
| mean | 0.01ms | 0.01ms | +0.000030ms | +0.20% |
| min | 0.01ms | 0.01ms | -0.00012ms | -1.20% |
| max | 0.03ms | 0.03ms | +0.00052ms | +1.64% |
| total | 0.30ms | 0.29ms | +0.00060ms | +0.20% |

### diff_batch (5 diffSchema across schemas)

# Perf Report — diff_batch (5 diffSchema across schemas).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.0045ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.45ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.013)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00052ms | +2.91% |
| p50 | 0.02ms | 0.02ms | +0.0036ms | +19.53% |
| p95 | 0.03ms | 0.03ms | -0.0031ms | -9.74% |
| p99 | 0.04ms | 0.04ms | +0.00037ms | +1.03% |
| mean | 0.02ms | 0.02ms | +0.0011ms | +5.14% |
| min | 0.02ms | 0.02ms | +0.0010ms | +5.98% |
| max | 0.04ms | 0.04ms | +0.0012ms | +3.33% |
| total | 0.45ms | 0.43ms | +0.02ms | +5.14% |

### down_error_handling (5 rollback of non-applied)

# Perf Report — down_error_handling (5 rollback of non-applied).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.00088ms |
| p50 | 0.00092ms |
| p95 | 0.0028ms |
| p99 | 0.0060ms |
| mean | 0.0014ms |
| stdev | 0.0013ms |
| min | 0.00088ms |
| max | 0.0068ms |
| total | 0.03ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.063)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00093ms | 0.0010ms | -0.000066ms | -6.62% |
| p50 | 0.00097ms | 0.0010ms | -0.000025ms | -2.55% |
| p95 | 0.0029ms | 0.0019ms | +0.0011ms | +58.11% |
| p99 | 0.0064ms | 0.0066ms | -0.00021ms | -3.20% |
| mean | 0.0015ms | 0.0014ms | +0.000087ms | +6.30% |
| min | 0.00093ms | 0.00096ms | -0.000028ms | -2.93% |
| max | 0.0072ms | 0.0077ms | -0.00053ms | -6.86% |
| total | 0.03ms | 0.03ms | +0.0017ms | +6.30% |

### lock_acquire_release_batch (10 acquire-release cycle)

# Perf Report — lock_acquire_release_batch (10 acquire-release cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0013ms |
| p50 | 0.0014ms |
| p95 | 0.0059ms |
| p99 | 0.0065ms |
| mean | 0.0022ms |
| stdev | 0.0015ms |
| min | 0.0013ms |
| max | 0.0067ms |
| total | 0.04ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.085)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0014ms | 0.0021ms | -0.00067ms | -31.78% |
| p50 | 0.0015ms | 0.0023ms | -0.00078ms | -33.86% |
| p95 | 0.0064ms | 0.0034ms | +0.0030ms | +88.25% |
| p99 | 0.0071ms | 0.0046ms | +0.0025ms | +54.36% |
| mean | 0.0024ms | 0.0025ms | -0.00015ms | -5.80% |
| min | 0.0014ms | 0.0020ms | -0.00060ms | -29.15% |
| max | 0.0072ms | 0.0049ms | +0.0024ms | +48.43% |
| total | 0.05ms | 0.05ms | -0.0029ms | -5.80% |

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
| stdev | 0.0039ms |
| min | 0.0085ms |
| max | 0.02ms |
| total | 0.26ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.102)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00018ms | -1.52% |
| p50 | 0.01ms | 0.01ms | +0.000048ms | +0.39% |
| p95 | 0.02ms | 0.02ms | +0.0034ms | +16.03% |
| p99 | 0.03ms | 0.02ms | +0.0016ms | +6.52% |
| mean | 0.01ms | 0.01ms | +0.00068ms | +5.06% |
| min | 0.0094ms | 0.0096ms | -0.00017ms | -1.77% |
| max | 0.03ms | 0.02ms | +0.0011ms | +4.47% |
| total | 0.28ms | 0.27ms | +0.01ms | +5.06% |

