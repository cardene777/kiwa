# Perf Suite — query-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 0.01ms | 0.02ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 0.0063ms | 0.01ms | 100ms | 0.00048ms | PASS | stable (換算後 p10 +19% (閾値未満)、 p95 +44% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 0.03ms | 0.03ms | 100ms | 0.00048ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | cpu | 0.09ms | 0.10ms | 0.01ms | 0.129 | 0.126 | 0.01ms | 0.01ms |
| mutation_invalidate_batch (5 mutate with invalidate chain) | cpu | 0.09ms | 0.10ms | 0.0063ms | 0.074 | 0.062 | 0.0061ms | 0.0051ms |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | cpu | 0.09ms | 0.09ms | 0.03ms | 0.290 | 0.277 | 0.02ms | 0.02ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 0.05ms | 200ms | PASS |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 0.04ms | 200ms | PASS |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 0.11ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 7440 B | 0 B | 102400 B | yes | PASS |
| mutation_invalidate_batch (5 mutate with invalidate chain) | -264 B | 0 B | 102400 B | yes | PASS |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 1264 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dashboard_fetch_workflow (10 fetchQuery across 4 providers)

# Perf Report — dashboard_fetch_workflow (10 fetchQuery across 4 providers).serial

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
| total | 0.26ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.985)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00027ms | +2.58% |
| p50 | 0.01ms | 0.01ms | +0.00041ms | +3.69% |
| p95 | 0.02ms | 0.03ms | -0.0069ms | -24.84% |
| p99 | 0.02ms | 0.03ms | -0.0069ms | -24.38% |
| mean | 0.01ms | 0.01ms | -0.00039ms | -2.95% |
| min | 0.010ms | 0.01ms | -0.00019ms | -1.88% |
| max | 0.02ms | 0.03ms | -0.0069ms | -24.27% |
| total | 0.26ms | 0.26ms | -0.0078ms | -2.95% |

### mutation_invalidate_batch (5 mutate with invalidate chain)

# Perf Report — mutation_invalidate_batch (5 mutate with invalidate chain).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0063ms |
| p50 | 0.0066ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0073ms |
| stdev | 0.0014ms |
| min | 0.0061ms |
| max | 0.01ms |
| total | 0.15ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.966)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0061ms | 0.0051ms | +0.00099ms | +19.27% |
| p50 | 0.0064ms | 0.0053ms | +0.0011ms | +20.99% |
| p95 | 0.01ms | 0.0071ms | +0.0031ms | +43.68% |
| p99 | 0.01ms | 0.0093ms | +0.0016ms | +17.23% |
| mean | 0.0070ms | 0.0058ms | +0.0013ms | +22.24% |
| min | 0.0059ms | 0.0051ms | +0.00083ms | +16.35% |
| max | 0.01ms | 0.0099ms | +0.0012ms | +12.45% |
| total | 0.14ms | 0.12ms | +0.03ms | +22.24% |

### subscribe_error_handling (5 fetch throw + catch + listener notify)

# Perf Report — subscribe_error_handling (5 fetch throw + catch + listener notify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0032ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.55ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.958)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.0010ms | +4.40% |
| p50 | 0.03ms | 0.02ms | +0.0011ms | +4.56% |
| p95 | 0.03ms | 0.03ms | +0.0038ms | +13.15% |
| p99 | 0.04ms | 0.03ms | +0.0035ms | +10.80% |
| mean | 0.03ms | 0.02ms | +0.0012ms | +4.92% |
| min | 0.02ms | 0.02ms | +0.0020ms | +9.19% |
| max | 0.04ms | 0.03ms | +0.0034ms | +10.29% |
| total | 0.52ms | 0.50ms | +0.02ms | +4.92% |

