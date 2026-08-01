# Perf Suite — query-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 0.01ms | 0.03ms | 100ms | 0.00051ms | PASS | stable — gate 無効 (regressionGate=false) |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 0.0052ms | 0.02ms | 100ms | 0.00050ms | PASS | stable (換算後 p10 +2% (閾値未満)、 p95 +252% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 0.02ms | 0.04ms | 100ms | 0.00050ms | PASS | stable (換算後 p10 -0% (閾値未満)、 p95 +54% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | cpu | 0.08ms | 0.12ms | 0.01ms | 0.139 | 0.126 | n/a | 20.0% | 0.01ms | 0.01ms |
| mutation_invalidate_batch (5 mutate with invalidate chain) | cpu | 0.08ms | 0.14ms | 0.0052ms | 0.063 | 0.062 | n/a | 20.0% | 0.0052ms | 0.0051ms |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | cpu | 0.08ms | 0.09ms | 0.02ms | 0.277 | 0.277 | n/a | 20.0% | 0.02ms | 0.02ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 0.05ms | 200ms | PASS |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 0.03ms | 200ms | PASS |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 0.12ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | -14352 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 632 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 1440 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### dashboard_fetch_workflow (10 fetchQuery across 4 providers)

# Perf Report — dashboard_fetch_workflow (10 fetchQuery across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0058ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.30ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.010)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.0011ms | +10.03% |
| p50 | 0.01ms | 0.01ms | +0.0013ms | +11.45% |
| p95 | 0.03ms | 0.03ms | +0.0021ms | +7.45% |
| p99 | 0.03ms | 0.03ms | +0.0033ms | +11.81% |
| mean | 0.01ms | 0.01ms | +0.0018ms | +13.98% |
| min | 0.01ms | 0.01ms | +0.0013ms | +12.63% |
| max | 0.03ms | 0.03ms | +0.0037ms | +12.87% |
| total | 0.30ms | 0.26ms | +0.04ms | +13.98% |

### mutation_invalidate_batch (5 mutate with invalidate chain)

# Perf Report — mutation_invalidate_batch (5 mutate with invalidate chain).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0052ms |
| p50 | 0.0053ms |
| p95 | 0.02ms |
| p99 | 0.14ms |
| mean | 0.01ms |
| stdev | 0.04ms |
| min | 0.0050ms |
| max | 0.16ms |
| total | 0.29ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.009)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0052ms | 0.0051ms | +0.000086ms | +1.68% |
| p50 | 0.0053ms | 0.0053ms | +0.000067ms | +1.27% |
| p95 | 0.03ms | 0.0071ms | +0.02ms | +252.24% |
| p99 | 0.14ms | 0.0093ms | +0.13ms | +1379.77% |
| mean | 0.01ms | 0.0058ms | +0.0090ms | +155.79% |
| min | 0.0050ms | 0.0051ms | -0.000040ms | -0.78% |
| max | 0.17ms | 0.0099ms | +0.16ms | +1583.69% |
| total | 0.29ms | 0.12ms | +0.18ms | +155.79% |

### subscribe_error_handling (5 fetch throw + catch + listener notify)

# Perf Report — subscribe_error_handling (5 fetch throw + catch + listener notify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.13ms |
| mean | 0.03ms |
| stdev | 0.03ms |
| min | 0.02ms |
| max | 0.15ms |
| total | 0.64ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.006)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.000049ms | -0.21% |
| p50 | 0.02ms | 0.02ms | +0.00034ms | +1.41% |
| p95 | 0.04ms | 0.03ms | +0.02ms | +53.73% |
| p99 | 0.13ms | 0.03ms | +0.10ms | +303.25% |
| mean | 0.03ms | 0.02ms | +0.0071ms | +28.40% |
| min | 0.02ms | 0.02ms | +0.00029ms | +1.32% |
| max | 0.15ms | 0.03ms | +0.12ms | +357.02% |
| total | 0.64ms | 0.50ms | +0.14ms | +28.40% |

