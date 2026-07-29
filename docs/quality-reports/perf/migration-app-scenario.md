# Perf Suite — migration-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| apply_workflow (10 pending migrations + history) | 0.01ms | 0.03ms | 100ms | 0.00050ms | PASS | stable (p10 +2% (閾値未満)、 p95 +42% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| diff_batch (5 diffSchema across schemas) | 0.02ms | 0.04ms | 100ms | 0.00050ms | PASS | stable (p10 +7% (閾値未満)、 p95 +47% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| down_error_handling (5 rollback of non-applied) | 0.00092ms | 0.0016ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| lock_acquire_release_batch (10 acquire-release cycle) | 0.0019ms | 0.0037ms | 100ms | 0.00049ms | PASS | stable (p10 +1% (閾値未満)、 p95 +32% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| dryrun_dep_batch (5 plan + resolve) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| apply_workflow (10 pending migrations + history) | cpu | 0.08ms | 0.01ms | 0.129 | 0.127 | 0.01ms | 0.01ms |
| diff_batch (5 diffSchema across schemas) | cpu | 0.08ms | 0.02ms | 0.222 | 0.207 | 0.02ms | 0.02ms |
| down_error_handling (5 rollback of non-applied) | cpu | 0.08ms | 0.00092ms | 0.011 | 0.011 | 0.00090ms | 0.00092ms |
| lock_acquire_release_batch (10 acquire-release cycle) | cpu | 0.08ms | 0.0019ms | 0.023 | 0.023 | 0.0019ms | 0.0018ms |
| dryrun_dep_batch (5 plan + resolve) | cpu | 0.08ms | 0.01ms | 0.138 | 0.138 | 0.01ms | 0.01ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| apply_workflow (10 pending migrations + history) | 0.04ms | 200ms | PASS |
| diff_batch (5 diffSchema across schemas) | 0.09ms | 200ms | PASS |
| down_error_handling (5 rollback of non-applied) | 0.00ms | 200ms | PASS |
| lock_acquire_release_batch (10 acquire-release cycle) | 0.01ms | 200ms | PASS |
| dryrun_dep_batch (5 plan + resolve) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| apply_workflow (10 pending migrations + history) | -4872 B | 0 B | 102400 B | yes | PASS |
| diff_batch (5 diffSchema across schemas) | -584 B | 0 B | 102400 B | yes | PASS |
| down_error_handling (5 rollback of non-applied) | 72 B | 0 B | 102400 B | yes | PASS |
| lock_acquire_release_batch (10 acquire-release cycle) | 8888 B | 0 B | 102400 B | yes | PASS |
| dryrun_dep_batch (5 plan + resolve) | -238400 B | 0 B | 102400 B | yes | PASS |

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
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.0083ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00016ms | +1.57% |
| p50 | 0.01ms | 0.01ms | -0.00012ms | -0.91% |
| p95 | 0.03ms | 0.02ms | +0.0095ms | +41.62% |
| p99 | 0.04ms | 0.03ms | +0.01ms | +38.44% |
| mean | 0.02ms | 0.02ms | +0.0012ms | +7.98% |
| min | 0.01ms | 0.01ms | +0.000042ms | +0.41% |
| max | 0.04ms | 0.03ms | +0.01ms | +37.85% |
| total | 0.33ms | 0.30ms | +0.02ms | +7.98% |

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
| stdev | 0.0065ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.0012ms | +6.79% |
| p50 | 0.02ms | 0.02ms | +0.0034ms | +19.02% |
| p95 | 0.04ms | 0.03ms | +0.01ms | +46.56% |
| p99 | 0.04ms | 0.04ms | +0.0050ms | +13.82% |
| mean | 0.02ms | 0.02ms | +0.0038ms | +19.41% |
| min | 0.02ms | 0.02ms | +0.0020ms | +12.70% |
| max | 0.04ms | 0.04ms | +0.0033ms | +8.52% |
| total | 0.47ms | 0.39ms | +0.08ms | +19.41% |

### down_error_handling (5 rollback of non-applied)

# Perf Report — down_error_handling (5 rollback of non-applied).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.00092ms |
| p50 | 0.00092ms |
| p95 | 0.0016ms |
| p99 | 0.0046ms |
| mean | 0.0012ms |
| stdev | 0.00099ms |
| min | 0.00088ms |
| max | 0.0053ms |
| total | 0.02ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00092ms | 0.00092ms | 0.00ms | 0.00% |
| p50 | 0.00092ms | 0.00096ms | -0.000041ms | -4.28% |
| p95 | 0.0016ms | 0.0070ms | -0.0054ms | -77.41% |
| p99 | 0.0046ms | 0.0077ms | -0.0031ms | -40.19% |
| mean | 0.0012ms | 0.0016ms | -0.00046ms | -28.26% |
| min | 0.00088ms | 0.00092ms | -0.000041ms | -4.48% |
| max | 0.0053ms | 0.0078ms | -0.0025ms | -31.92% |
| total | 0.02ms | 0.03ms | -0.0092ms | -28.26% |

### lock_acquire_release_batch (10 acquire-release cycle)

# Perf Report — lock_acquire_release_batch (10 acquire-release cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0019ms |
| p50 | 0.0021ms |
| p95 | 0.0037ms |
| p99 | 0.0038ms |
| mean | 0.0023ms |
| stdev | 0.00060ms |
| min | 0.0018ms |
| max | 0.0038ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0019ms | 0.0018ms | +0.000042ms | +2.29% |
| p50 | 0.0021ms | 0.0019ms | +0.00019ms | +9.65% |
| p95 | 0.0037ms | 0.0028ms | +0.00094ms | +33.78% |
| p99 | 0.0038ms | 0.0032ms | +0.00062ms | +19.51% |
| mean | 0.0023ms | 0.0021ms | +0.00018ms | +8.37% |
| min | 0.0018ms | 0.0018ms | 0.00ms | 0.00% |
| max | 0.0038ms | 0.0033ms | +0.00054ms | +16.50% |
| total | 0.05ms | 0.04ms | +0.0036ms | +8.37% |

### dryrun_dep_batch (5 plan + resolve)

# Perf Report — dryrun_dep_batch (5 plan + resolve).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0061ms |
| min | 0.0088ms |
| max | 0.04ms |
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.000013ms | +0.11% |
| p50 | 0.01ms | 0.01ms | +0.00019ms | +1.62% |
| p95 | 0.02ms | 0.02ms | -0.00074ms | -3.24% |
| p99 | 0.03ms | 0.02ms | +0.01ms | +49.61% |
| mean | 0.01ms | 0.01ms | +0.00079ms | +6.20% |
| min | 0.0088ms | 0.0090ms | -0.00025ms | -2.78% |
| max | 0.04ms | 0.02ms | +0.01ms | +62.75% |
| total | 0.27ms | 0.25ms | +0.02ms | +6.20% |

