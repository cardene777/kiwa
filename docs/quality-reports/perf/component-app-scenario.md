# Perf Suite — component-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00058ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| storybook_registry_burst (create registry x 30) | 0.0038ms | 0.02ms | 50ms | 0.00099ms | PASS | stable (換算後 p10 +63% (閾値未満)、 p95 +74% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| playwright_ct_mock_lifecycle (create mock x 30) | 0.0018ms | 0.0068ms | 50ms | 0.0010ms | PASS | stable — gate 無効 (regressionGate=false) |
| chromatic_visual_snapshot (create mock x 30) | 0.0049ms | 0.02ms | 50ms | 0.00084ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| storybook_registry_burst (create registry x 30) | cpu | 0.10ms | 0.11ms | 0.0038ms | 0.039 | 0.024 | 0.0032ms | 0.0020ms |
| playwright_ct_mock_lifecycle (create mock x 30) | cpu | 0.09ms | 0.10ms | 0.0018ms | 0.019 | 0.016 | 0.0015ms | 0.0013ms |
| chromatic_visual_snapshot (create mock x 30) | cpu | 0.11ms | 0.12ms | 0.0049ms | 0.044 | 0.031 | 0.0035ms | 0.0025ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| storybook_registry_burst (create registry x 30) | 0.02ms | 100ms | PASS |
| playwright_ct_mock_lifecycle (create mock x 30) | 0.01ms | 100ms | PASS |
| chromatic_visual_snapshot (create mock x 30) | 0.02ms | 100ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| storybook_registry_burst (create registry x 30) | -12920 B | 0 B | 102400 B | yes | PASS |
| playwright_ct_mock_lifecycle (create mock x 30) | 648 B | 0 B | 102400 B | yes | PASS |
| chromatic_visual_snapshot (create mock x 30) | 648 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### storybook_registry_burst (create registry x 30)

# Perf Report — storybook_registry_burst (create registry x 30).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0038ms |
| p50 | 0.0046ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0065ms |
| stdev | 0.0054ms |
| min | 0.0022ms |
| max | 0.02ms |
| total | 0.13ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.848)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0032ms | 0.0020ms | +0.0012ms | +62.66% |
| p50 | 0.0039ms | 0.0049ms | -0.0010ms | -20.61% |
| p95 | 0.02ms | 0.0098ms | +0.0073ms | +74.31% |
| p99 | 0.02ms | 0.01ms | +0.0053ms | +38.38% |
| mean | 0.0055ms | 0.0053ms | +0.00021ms | +3.94% |
| min | 0.0018ms | 0.0016ms | +0.00021ms | +13.03% |
| max | 0.02ms | 0.01ms | +0.0048ms | +32.44% |
| total | 0.11ms | 0.11ms | +0.0042ms | +3.94% |

### playwright_ct_mock_lifecycle (create mock x 30)

# Perf Report — playwright_ct_mock_lifecycle (create mock x 30).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0018ms |
| p50 | 0.0020ms |
| p95 | 0.0068ms |
| p99 | 0.0080ms |
| mean | 0.0027ms |
| stdev | 0.0019ms |
| min | 0.0013ms |
| max | 0.0083ms |
| total | 0.05ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.864)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0015ms | 0.0013ms | +0.00027ms | +20.99% |
| p50 | 0.0017ms | 0.0026ms | -0.00088ms | -33.68% |
| p95 | 0.0059ms | 0.0076ms | -0.0017ms | -22.79% |
| p99 | 0.0069ms | 0.01ms | -0.0046ms | -40.02% |
| mean | 0.0023ms | 0.0034ms | -0.0011ms | -31.86% |
| min | 0.0011ms | 0.0010ms | +0.000038ms | +3.69% |
| max | 0.0072ms | 0.01ms | -0.0053ms | -42.63% |
| total | 0.05ms | 0.07ms | -0.02ms | -31.86% |

### chromatic_visual_snapshot (create mock x 30)

# Perf Report — chromatic_visual_snapshot (create mock x 30).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0049ms |
| p50 | 0.0062ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0082ms |
| stdev | 0.0047ms |
| min | 0.0048ms |
| max | 0.02ms |
| total | 0.16ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.716)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0035ms | 0.0025ms | +0.0010ms | +39.73% |
| p50 | 0.0045ms | 0.0040ms | +0.00048ms | +12.09% |
| p95 | 0.01ms | 0.02ms | -0.0061ms | -32.49% |
| p99 | 0.01ms | 0.02ms | -0.0053ms | -27.35% |
| mean | 0.0059ms | 0.0059ms | -0.000051ms | -0.85% |
| min | 0.0035ms | 0.0018ms | +0.0017ms | +97.75% |
| max | 0.01ms | 0.02ms | -0.0051ms | -26.12% |
| total | 0.12ms | 0.12ms | -0.0010ms | -0.85% |

