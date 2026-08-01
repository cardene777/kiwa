# Perf Suite — rust-lib-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 0.0044ms | 0.02ms | 100ms | 0.00044ms | PASS | stable — gate 無効 (regressionGate=false) |
| middleware_chain_batch (5 tower layer chains) | 0.0039ms | 0.0046ms | 100ms | 0.00044ms | PASS | stable — gate 無効 (regressionGate=false) |
| route_error_handling (5 handler throw + catch) | 0.01ms | 0.06ms | 100ms | 0.00044ms | PASS | stable (換算後 p10 -4% (閾値未満)、 p95 +58% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.04ms | 100ms | 0.00044ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.01ms | 0.02ms | 100ms | 0.00044ms | PASS | stable (換算後 p10 -4% (閾値未満)、 p95 +38% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | cpu | 0.09ms | 0.10ms | 0.0044ms | 0.048 | 0.048 | n/a | 20.0% | 0.0039ms | 0.0040ms |
| middleware_chain_batch (5 tower layer chains) | cpu | 0.09ms | 0.09ms | 0.0039ms | 0.041 | 0.042 | n/a | 20.0% | 0.0034ms | 0.0035ms |
| route_error_handling (5 handler throw + catch) | cpu | 0.09ms | 0.19ms | 0.01ms | 0.133 | 0.139 | n/a | 20.0% | 0.01ms | 0.01ms |
| retry_recovery (5 flaky async retry to success) | cpu | 0.09ms | 0.09ms | 0.03ms | 0.332 | 0.328 | n/a | 20.0% | 0.03ms | 0.03ms |
| concurrent_batch (5 batches of 4 items with error isolation) | cpu | 0.09ms | 0.09ms | 0.01ms | 0.114 | 0.119 | n/a | 20.0% | 0.0095ms | 0.0099ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 0.02ms | 200ms | PASS |
| middleware_chain_batch (5 tower layer chains) | 0.03ms | 200ms | PASS |
| route_error_handling (5 handler throw + catch) | 0.06ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.15ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | -3000 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| middleware_chain_batch (5 tower layer chains) | 1344 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| route_error_handling (5 handler throw + catch) | 11184 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| retry_recovery (5 flaky async retry to success) | 3760 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | -1688 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### rest_handler_workflow (10 axum + actix + rocket mixed)

# Perf Report — rest_handler_workflow (10 axum + actix + rocket mixed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0044ms |
| p50 | 0.0049ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0078ms |
| stdev | 0.0067ms |
| min | 0.0041ms |
| max | 0.03ms |
| total | 0.16ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.888)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0039ms | 0.0040ms | -0.000039ms | -0.98% |
| p50 | 0.0043ms | 0.0043ms | +0.000056ms | +1.32% |
| p95 | 0.02ms | 0.02ms | -0.0044ms | -18.15% |
| p99 | 0.02ms | 0.04ms | -0.01ms | -37.29% |
| mean | 0.0069ms | 0.0091ms | -0.0022ms | -23.86% |
| min | 0.0036ms | 0.0039ms | -0.00029ms | -7.47% |
| max | 0.03ms | 0.04ms | -0.02ms | -39.95% |
| total | 0.14ms | 0.18ms | -0.04ms | -23.86% |

### middleware_chain_batch (5 tower layer chains)

# Perf Report — middleware_chain_batch (5 tower layer chains).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0039ms |
| p50 | 0.0039ms |
| p95 | 0.0046ms |
| p99 | 0.0073ms |
| mean | 0.0042ms |
| stdev | 0.00091ms |
| min | 0.0038ms |
| max | 0.0080ms |
| total | 0.08ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.886)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0034ms | 0.0035ms | -0.000067ms | -1.91% |
| p50 | 0.0035ms | 0.0036ms | -0.00016ms | -4.28% |
| p95 | 0.0041ms | 0.0049ms | -0.00085ms | -17.22% |
| p99 | 0.0065ms | 0.0061ms | +0.00030ms | +4.94% |
| mean | 0.0037ms | 0.0039ms | -0.00022ms | -5.66% |
| min | 0.0034ms | 0.0034ms | -0.000021ms | -0.61% |
| max | 0.0070ms | 0.0065ms | +0.00059ms | +9.16% |
| total | 0.07ms | 0.08ms | -0.0044ms | -5.66% |

### route_error_handling (5 handler throw + catch)

# Perf Report — route_error_handling (5 handler throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.03ms |
| p95 | 0.06ms |
| p99 | 0.10ms |
| mean | 0.03ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.11ms |
| total | 0.66ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.884)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00045ms | -3.91% |
| p50 | 0.03ms | 0.01ms | +0.02ms | +126.37% |
| p95 | 0.05ms | 0.03ms | +0.02ms | +58.04% |
| p99 | 0.08ms | 0.04ms | +0.05ms | +135.19% |
| mean | 0.03ms | 0.02ms | +0.01ms | +93.04% |
| min | 0.01ms | 0.01ms | -0.00057ms | -5.07% |
| max | 0.09ms | 0.04ms | +0.06ms | +151.30% |
| total | 0.58ms | 0.30ms | +0.28ms | +93.04% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0033ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.66ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.883)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.00030ms | +1.12% |
| p50 | 0.03ms | 0.03ms | +0.000020ms | +0.07% |
| p95 | 0.04ms | 0.04ms | -0.0031ms | -8.10% |
| p99 | 0.04ms | 0.04ms | -0.0020ms | -5.06% |
| mean | 0.03ms | 0.03ms | -0.00031ms | -1.03% |
| min | 0.03ms | 0.03ms | +0.00042ms | +1.59% |
| max | 0.04ms | 0.04ms | -0.0017ms | -4.33% |
| total | 0.59ms | 0.59ms | -0.0061ms | -1.03% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0040ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.27ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.884)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0095ms | 0.0099ms | -0.00041ms | -4.15% |
| p50 | 0.01ms | 0.01ms | -0.00061ms | -5.72% |
| p95 | 0.02ms | 0.01ms | +0.0053ms | +37.53% |
| p99 | 0.02ms | 0.02ms | +0.00015ms | +0.73% |
| mean | 0.01ms | 0.01ms | +0.00040ms | +3.47% |
| min | 0.0093ms | 0.0095ms | -0.00022ms | -2.32% |
| max | 0.02ms | 0.02ms | -0.0011ms | -5.19% |
| total | 0.24ms | 0.23ms | +0.0079ms | +3.47% |

