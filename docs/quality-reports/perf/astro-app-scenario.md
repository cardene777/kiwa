# Perf Suite — astro-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00058ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 0.12ms | 0.35ms | 100ms | 0.0010ms | PASS | stable (換算後 p10 +7% (閾値未満)、 p95 +125% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| endpoint_batch (5 invokeEndpoint JSON responses) | 0.03ms | 0.04ms | 100ms | 0.0011ms | PASS | stable (換算後 p10 +20% (閾値未満)、 p95 +27% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| endpoint_error_handling (5 throw + catch) | 0.04ms | 0.25ms | 100ms | 0.0011ms | PASS | stable (換算後 p10 +3% (閾値未満)、 p95 +465% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | cpu | 0.09ms | 0.36ms | 0.12ms | 1.298 | 1.217 | n/a | 20.0% | 0.11ms | 0.10ms |
| endpoint_batch (5 invokeEndpoint JSON responses) | cpu | 0.09ms | 0.10ms | 0.03ms | 0.364 | 0.304 | n/a | 20.0% | 0.03ms | 0.03ms |
| endpoint_error_handling (5 throw + catch) | cpu | 0.09ms | 0.20ms | 0.04ms | 0.392 | 0.379 | n/a | 20.0% | 0.03ms | 0.03ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 0.53ms | 200ms | PASS |
| endpoint_batch (5 invokeEndpoint JSON responses) | 0.26ms | 200ms | PASS |
| endpoint_error_handling (5 throw + catch) | 0.16ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | -5960 B | 1488 B | 102400 B | yes | 23 (3 + 20) | PASS |
| endpoint_batch (5 invokeEndpoint JSON responses) | -92440 B | 1800 B | 102400 B | yes | 23 (3 + 20) | PASS |
| endpoint_error_handling (5 throw + catch) | 2992 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### page_render_workflow (10 renderAstroPage)

# Perf Report — page_render_workflow (10 renderAstroPage).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.12ms |
| p50 | 0.16ms |
| p95 | 0.35ms |
| p99 | 0.82ms |
| mean | 0.22ms |
| stdev | 0.18ms |
| min | 0.11ms |
| max | 0.93ms |
| total | 4.37ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.877)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.11ms | 0.10ms | +0.0066ms | +6.60% |
| p50 | 0.14ms | 0.12ms | +0.02ms | +18.16% |
| p95 | 0.31ms | 0.14ms | +0.17ms | +124.51% |
| p99 | 0.72ms | 0.19ms | +0.53ms | +278.97% |
| mean | 0.19ms | 0.12ms | +0.07ms | +59.91% |
| min | 0.10ms | 0.10ms | -0.0013ms | -1.33% |
| max | 0.82ms | 0.20ms | +0.62ms | +305.42% |
| total | 3.83ms | 2.40ms | +1.44ms | +59.91% |

### endpoint_batch (5 invokeEndpoint JSON responses)

# Perf Report — endpoint_batch (5 invokeEndpoint JSON responses).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.04ms |
| stdev | 0.0030ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.73ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.925)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.0052ms | +19.91% |
| p50 | 0.03ms | 0.03ms | +0.0054ms | +19.58% |
| p95 | 0.04ms | 0.03ms | +0.0085ms | +27.17% |
| p99 | 0.04ms | 0.03ms | +0.0077ms | +23.57% |
| mean | 0.03ms | 0.03ms | +0.0059ms | +21.34% |
| min | 0.03ms | 0.03ms | +0.0032ms | +12.22% |
| max | 0.04ms | 0.03ms | +0.0075ms | +22.72% |
| total | 0.67ms | 0.56ms | +0.12ms | +21.34% |

### endpoint_error_handling (5 throw + catch)

# Perf Report — endpoint_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.05ms |
| p95 | 0.25ms |
| p99 | 0.33ms |
| mean | 0.09ms |
| stdev | 0.09ms |
| min | 0.04ms |
| max | 0.36ms |
| total | 1.90ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.956)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.0012ms | +3.47% |
| p50 | 0.04ms | 0.04ms | +0.0086ms | +24.67% |
| p95 | 0.24ms | 0.04ms | +0.20ms | +464.97% |
| p99 | 0.32ms | 0.05ms | +0.27ms | +576.09% |
| mean | 0.09ms | 0.04ms | +0.05ms | +149.74% |
| min | 0.03ms | 0.03ms | +0.0014ms | +4.18% |
| max | 0.34ms | 0.05ms | +0.29ms | +600.14% |
| total | 1.81ms | 0.73ms | +1.09ms | +149.74% |

