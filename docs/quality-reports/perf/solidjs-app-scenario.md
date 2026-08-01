# Perf Suite — solidjs-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00058ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| render_workflow (10 renderSolid) | 0.01ms | 0.03ms | 100ms | 0.0010ms | PASS | stable (換算後 p10 -0% (閾値未満)、 p95 +37% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| signal_reactive_batch (5 signal+effect update chains) | 0.0049ms | 0.0064ms | 100ms | 0.0010ms | PASS | stable — gate 無効 (regressionGate=false) |
| render_error_handling (5 throw + catch in component) | 0.01ms | 0.01ms | 100ms | 0.0010ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| render_workflow (10 renderSolid) | cpu | 0.09ms | 0.11ms | 0.01ms | 0.114 | 0.114 | n/a | 20.0% | 0.0092ms | 0.0092ms |
| signal_reactive_batch (5 signal+effect update chains) | cpu | 0.09ms | 0.09ms | 0.0049ms | 0.053 | 0.054 | n/a | 20.0% | 0.0042ms | 0.0043ms |
| render_error_handling (5 throw + catch in component) | cpu | 0.09ms | 0.09ms | 0.01ms | 0.111 | 0.110 | n/a | 20.0% | 0.0090ms | 0.0090ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| render_workflow (10 renderSolid) | 0.05ms | 200ms | PASS |
| signal_reactive_batch (5 signal+effect update chains) | 0.03ms | 200ms | PASS |
| render_error_handling (5 throw + catch in component) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| render_workflow (10 renderSolid) | -18680 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| signal_reactive_batch (5 signal+effect update chains) | -17184 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| render_error_handling (5 throw + catch in component) | 14952 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### render_workflow (10 renderSolid)

# Perf Report — render_workflow (10 renderSolid).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0056ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.30ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.858)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0092ms | 0.0092ms | -0.000020ms | -0.22% |
| p50 | 0.01ms | 0.01ms | +0.0013ms | +12.57% |
| p95 | 0.02ms | 0.02ms | +0.0064ms | +36.57% |
| p99 | 0.03ms | 0.02ms | +0.0053ms | +26.43% |
| mean | 0.01ms | 0.01ms | +0.0011ms | +9.33% |
| min | 0.0091ms | 0.0091ms | -0.0000081ms | -0.09% |
| max | 0.03ms | 0.02ms | +0.0050ms | +24.28% |
| total | 0.26ms | 0.24ms | +0.02ms | +9.33% |

### signal_reactive_batch (5 signal+effect update chains)

# Perf Report — signal_reactive_batch (5 signal+effect update chains).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0049ms |
| p50 | 0.0050ms |
| p95 | 0.0064ms |
| p99 | 0.0069ms |
| mean | 0.0053ms |
| stdev | 0.00058ms |
| min | 0.0049ms |
| max | 0.0070ms |
| total | 0.11ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.864)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0042ms | 0.0043ms | -0.000041ms | -0.95% |
| p50 | 0.0043ms | 0.0044ms | -0.000081ms | -1.84% |
| p95 | 0.0055ms | 0.0058ms | -0.00031ms | -5.30% |
| p99 | 0.0060ms | 0.0073ms | -0.0013ms | -17.84% |
| mean | 0.0045ms | 0.0048ms | -0.00027ms | -5.64% |
| min | 0.0042ms | 0.0042ms | +0.000037ms | +0.89% |
| max | 0.0061ms | 0.0076ms | -0.0015ms | -20.24% |
| total | 0.09ms | 0.10ms | -0.0054ms | -5.64% |

### render_error_handling (5 throw + catch in component)

# Perf Report — render_error_handling (5 throw + catch in component).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00069ms |
| min | 0.01ms |
| max | 0.01ms |
| total | 0.21ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.872)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0090ms | 0.0090ms | +0.000054ms | +0.60% |
| p50 | 0.0091ms | 0.0092ms | -0.000089ms | -0.96% |
| p95 | 0.01ms | 0.010ms | +0.00072ms | +7.22% |
| p99 | 0.01ms | 0.01ms | +0.0012ms | +12.06% |
| mean | 0.0093ms | 0.0092ms | +0.000069ms | +0.74% |
| min | 0.0090ms | 0.0089ms | +0.000094ms | +1.05% |
| max | 0.01ms | 0.01ms | +0.0013ms | +13.26% |
| total | 0.19ms | 0.18ms | +0.0014ms | +0.74% |

