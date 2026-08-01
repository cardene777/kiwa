# Perf Suite — component-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| storybook_registry_burst (create registry x 30) | 0.0043ms | 0.03ms | 50ms | 0.00040ms | PASS | stable (換算後 p10 +74% (閾値未満)、 p95 +135% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| playwright_ct_mock_lifecycle (create mock x 30) | 0.0022ms | 0.0096ms | 50ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |
| chromatic_visual_snapshot (create mock x 30) | 0.0051ms | 0.02ms | 50ms | 0.00041ms | PASS | regressed — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| storybook_registry_burst (create registry x 30) | cpu | 0.10ms | 0.15ms | 0.0043ms | 0.042 | 0.024 | n/a | 20.0% | 0.0035ms | 0.0020ms |
| playwright_ct_mock_lifecycle (create mock x 30) | cpu | 0.10ms | 0.11ms | 0.0022ms | 0.022 | 0.016 | n/a | 20.0% | 0.0018ms | 0.0013ms |
| chromatic_visual_snapshot (create mock x 30) | cpu | 0.10ms | 0.10ms | 0.0051ms | 0.052 | 0.031 | n/a | 20.0% | 0.0042ms | 0.0025ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| storybook_registry_burst (create registry x 30) | 0.02ms | 100ms | PASS |
| playwright_ct_mock_lifecycle (create mock x 30) | 0.01ms | 100ms | PASS |
| chromatic_visual_snapshot (create mock x 30) | 0.02ms | 100ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| storybook_registry_burst (create registry x 30) | -20168 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| playwright_ct_mock_lifecycle (create mock x 30) | 648 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| chromatic_visual_snapshot (create mock x 30) | 744 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### storybook_registry_burst (create registry x 30)

# Perf Report — storybook_registry_burst (create registry x 30).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0043ms |
| p50 | 0.0056ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0086ms |
| min | 0.0029ms |
| max | 0.03ms |
| total | 0.22ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.808)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0035ms | 0.0020ms | +0.0015ms | +74.08% |
| p50 | 0.0045ms | 0.0049ms | -0.00040ms | -8.21% |
| p95 | 0.02ms | 0.0098ms | +0.01ms | +135.16% |
| p99 | 0.02ms | 0.01ms | +0.0093ms | +67.33% |
| mean | 0.0089ms | 0.0053ms | +0.0036ms | +67.16% |
| min | 0.0024ms | 0.0016ms | +0.00073ms | +45.01% |
| max | 0.02ms | 0.01ms | +0.0083ms | +56.11% |
| total | 0.18ms | 0.11ms | +0.07ms | +67.16% |

### playwright_ct_mock_lifecycle (create mock x 30)

# Perf Report — playwright_ct_mock_lifecycle (create mock x 30).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0022ms |
| p50 | 0.0031ms |
| p95 | 0.0096ms |
| p99 | 0.01ms |
| mean | 0.0040ms |
| stdev | 0.0028ms |
| min | 0.0012ms |
| max | 0.01ms |
| total | 0.08ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.822)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0018ms | 0.0013ms | +0.00052ms | +41.02% |
| p50 | 0.0026ms | 0.0026ms | -0.000035ms | -1.34% |
| p95 | 0.0079ms | 0.0076ms | +0.00027ms | +3.62% |
| p99 | 0.0093ms | 0.01ms | -0.0023ms | -19.72% |
| mean | 0.0033ms | 0.0034ms | -0.00019ms | -5.57% |
| min | 0.00096ms | 0.0010ms | -0.000082ms | -7.84% |
| max | 0.0096ms | 0.01ms | -0.0029ms | -23.25% |
| total | 0.07ms | 0.07ms | -0.0038ms | -5.57% |

### chromatic_visual_snapshot (create mock x 30)

# Perf Report — chromatic_visual_snapshot (create mock x 30).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0051ms |
| p50 | 0.0064ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0075ms |
| stdev | 0.0039ms |
| min | 0.0045ms |
| max | 0.02ms |
| total | 0.15ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.820)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0042ms | 0.0025ms | +0.0016ms | +65.50% |
| p50 | 0.0053ms | 0.0040ms | +0.0013ms | +32.68% |
| p95 | 0.01ms | 0.02ms | -0.0052ms | -27.47% |
| p99 | 0.02ms | 0.02ms | -0.0040ms | -20.23% |
| mean | 0.0062ms | 0.0059ms | +0.00028ms | +4.72% |
| min | 0.0037ms | 0.0018ms | +0.0019ms | +110.91% |
| max | 0.02ms | 0.02ms | -0.0036ms | -18.50% |
| total | 0.12ms | 0.12ms | +0.0056ms | +4.72% |

