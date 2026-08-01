# Perf Suite — migration-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| apply_workflow (10 pending migrations + history) | 0.01ms | 0.04ms | 100ms | 0.00048ms | PASS | stable (換算後 p10 +3% (閾値未満)、 p95 +47% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| diff_batch (5 diffSchema across schemas) | 0.02ms | 0.03ms | 100ms | 0.00048ms | PASS | stable — gate 無効 (regressionGate=false) |
| down_error_handling (5 rollback of non-applied) | 0.0012ms | 0.0020ms | 100ms | 0.00048ms | PASS | stable — gate 無効 (regressionGate=false) |
| lock_acquire_release_batch (10 acquire-release cycle) | 0.0015ms | 0.0044ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| dryrun_dep_batch (5 plan + resolve) | 0.01ms | 0.02ms | 100ms | 0.00052ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| apply_workflow (10 pending migrations + history) | cpu | 0.09ms | 0.10ms | 0.01ms | 0.132 | 0.128 | n/a | 20.0% | 0.01ms | 0.01ms |
| diff_batch (5 diffSchema across schemas) | cpu | 0.09ms | 0.09ms | 0.02ms | 0.242 | 0.216 | n/a | 20.0% | 0.02ms | 0.02ms |
| down_error_handling (5 rollback of non-applied) | cpu | 0.09ms | 0.09ms | 0.0012ms | 0.013 | 0.011 | n/a | 20.0% | 0.0012ms | 0.0010ms |
| lock_acquire_release_batch (10 acquire-release cycle) | cpu | 0.09ms | 0.09ms | 0.0015ms | 0.017 | 0.024 | n/a | 20.0% | 0.0015ms | 0.0021ms |
| dryrun_dep_batch (5 plan + resolve) | cpu | 0.09ms | 0.10ms | 0.01ms | 0.146 | 0.135 | n/a | 20.0% | 0.01ms | 0.01ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| apply_workflow (10 pending migrations + history) | 0.04ms | 200ms | PASS |
| diff_batch (5 diffSchema across schemas) | 0.08ms | 200ms | PASS |
| down_error_handling (5 rollback of non-applied) | 0.01ms | 200ms | PASS |
| lock_acquire_release_batch (10 acquire-release cycle) | 0.01ms | 200ms | PASS |
| dryrun_dep_batch (5 plan + resolve) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| apply_workflow (10 pending migrations + history) | -13576 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| diff_batch (5 diffSchema across schemas) | 744 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| down_error_handling (5 rollback of non-applied) | 664 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| lock_acquire_release_batch (10 acquire-release cycle) | 6888 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| dryrun_dep_batch (5 plan + resolve) | 6376 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### apply_workflow (10 pending migrations + history)

# Perf Report — apply_workflow (10 pending migrations + history).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.0079ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.36ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.950)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00035ms | +3.35% |
| p50 | 0.01ms | 0.01ms | +0.0013ms | +9.53% |
| p95 | 0.03ms | 0.02ms | +0.01ms | +47.03% |
| p99 | 0.04ms | 0.03ms | +0.0052ms | +17.26% |
| mean | 0.02ms | 0.01ms | +0.0022ms | +15.13% |
| min | 0.01ms | 0.01ms | +0.00028ms | +2.64% |
| max | 0.04ms | 0.03ms | +0.0037ms | +11.66% |
| total | 0.34ms | 0.29ms | +0.04ms | +15.13% |

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
| stdev | 0.0048ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.48ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.964)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.0022ms | +12.11% |
| p50 | 0.02ms | 0.02ms | +0.0029ms | +15.56% |
| p95 | 0.03ms | 0.03ms | -0.00046ms | -1.46% |
| p99 | 0.04ms | 0.04ms | +0.00091ms | +2.53% |
| mean | 0.02ms | 0.02ms | +0.0016ms | +7.46% |
| min | 0.02ms | 0.02ms | +0.0015ms | +8.94% |
| max | 0.04ms | 0.04ms | +0.0013ms | +3.38% |
| total | 0.46ms | 0.43ms | +0.03ms | +7.46% |

### down_error_handling (5 rollback of non-applied)

# Perf Report — down_error_handling (5 rollback of non-applied).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0012ms |
| p50 | 0.0013ms |
| p95 | 0.0020ms |
| p99 | 0.0049ms |
| mean | 0.0015ms |
| stdev | 0.00099ms |
| min | 0.0012ms |
| max | 0.0057ms |
| total | 0.03ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.964)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0012ms | 0.0010ms | +0.00017ms | +16.93% |
| p50 | 0.0012ms | 0.0010ms | +0.00022ms | +22.46% |
| p95 | 0.0019ms | 0.0019ms | +0.000063ms | +3.38% |
| p99 | 0.0048ms | 0.0066ms | -0.0018ms | -27.66% |
| mean | 0.0015ms | 0.0014ms | +0.000079ms | +5.70% |
| min | 0.0012ms | 0.00096ms | +0.00021ms | +21.54% |
| max | 0.0055ms | 0.0077ms | -0.0023ms | -29.52% |
| total | 0.03ms | 0.03ms | +0.0016ms | +5.70% |

### lock_acquire_release_batch (10 acquire-release cycle)

# Perf Report — lock_acquire_release_batch (10 acquire-release cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0015ms |
| p50 | 0.0017ms |
| p95 | 0.0044ms |
| p99 | 0.0047ms |
| mean | 0.0021ms |
| stdev | 0.00092ms |
| min | 0.0015ms |
| max | 0.0047ms |
| total | 0.04ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.993)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0015ms | 0.0021ms | -0.00059ms | -28.04% |
| p50 | 0.0017ms | 0.0023ms | -0.00062ms | -26.85% |
| p95 | 0.0044ms | 0.0034ms | +0.00099ms | +29.11% |
| p99 | 0.0047ms | 0.0046ms | +0.000072ms | +1.57% |
| mean | 0.0021ms | 0.0025ms | -0.00045ms | -18.00% |
| min | 0.0015ms | 0.0020ms | -0.00055ms | -27.05% |
| max | 0.0047ms | 0.0049ms | -0.00016ms | -3.24% |
| total | 0.04ms | 0.05ms | -0.0091ms | -18.00% |

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
| total | 0.28ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.041)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00098ms | +8.03% |
| p50 | 0.01ms | 0.01ms | +0.0010ms | +8.13% |
| p95 | 0.02ms | 0.02ms | +0.0023ms | +10.86% |
| p99 | 0.03ms | 0.02ms | +0.0012ms | +5.01% |
| mean | 0.01ms | 0.01ms | +0.0011ms | +8.26% |
| min | 0.01ms | 0.0096ms | +0.0020ms | +20.85% |
| max | 0.03ms | 0.02ms | +0.00093ms | +3.75% |
| total | 0.29ms | 0.27ms | +0.02ms | +8.26% |

