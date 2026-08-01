# Perf Suite — ui-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00029ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00058ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | 0.77ms | 7.49ms | 200ms | 0.00052ms | PASS | stable (換算後 p10 +0% (閾値未満)、 p95 +457% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| snapshot_batch (3 snapshot mode consecutive) | 0.44ms | 1.06ms | 200ms | 0.00051ms | PASS | stable (換算後 p10 +10% (閾値未満)、 p95 +56% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| mount_error_handling (3 throw + catch during render) | 0.81ms | 3.24ms | 200ms | 0.00052ms | PASS | stable (換算後 p10 -9% (閾値未満)、 p95 +87% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | cpu | 0.09ms | 0.10ms | 0.77ms | 8.538 | 8.519 | n/a | 20.0% | 0.69ms | 0.69ms |
| snapshot_batch (3 snapshot mode consecutive) | cpu | 0.09ms | 0.20ms | 0.44ms | 4.762 | 4.346 | n/a | 20.0% | 0.39ms | 0.35ms |
| mount_error_handling (3 throw + catch during render) | cpu | 0.09ms | 0.20ms | 0.81ms | 8.972 | 9.890 | n/a | 20.0% | 0.72ms | 0.80ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| component_workflow (3 different components mount+stop) | 3.28ms | 400ms | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 2.86ms | 400ms | PASS |
| mount_error_handling (3 throw + catch during render) | 4.75ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | -150928 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| snapshot_batch (3 snapshot mode consecutive) | -5120 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| mount_error_handling (3 throw + catch during render) | 4478080 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### component_workflow (3 different components mount+stop)

# Perf Report — component_workflow (3 different components mount+stop).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.77ms |
| p50 | 0.85ms |
| p95 | 7.49ms |
| p99 | 16.85ms |
| mean | 2.29ms |
| stdev | 4.25ms |
| min | 0.74ms |
| max | 19.19ms |
| total | 45.89ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.896)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.69ms | 0.69ms | +0.0015ms | +0.22% |
| p50 | 0.76ms | 0.81ms | -0.05ms | -6.09% |
| p95 | 6.71ms | 1.20ms | +5.51ms | +457.19% |
| p99 | 15.10ms | 2.02ms | +13.08ms | +647.21% |
| mean | 2.06ms | 0.91ms | +1.15ms | +126.35% |
| min | 0.67ms | 0.62ms | +0.05ms | +7.85% |
| max | 17.19ms | 2.22ms | +14.97ms | +672.94% |
| total | 41.11ms | 18.16ms | +22.95ms | +126.35% |

### snapshot_batch (3 snapshot mode consecutive)

# Perf Report — snapshot_batch (3 snapshot mode consecutive).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.44ms |
| p50 | 0.48ms |
| p95 | 1.06ms |
| p99 | 3.62ms |
| mean | 0.69ms |
| stdev | 0.84ms |
| min | 0.41ms |
| max | 4.26ms |
| total | 13.86ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.874)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.39ms | 0.35ms | +0.03ms | +9.58% |
| p50 | 0.42ms | 0.38ms | +0.04ms | +11.45% |
| p95 | 0.93ms | 0.59ms | +0.33ms | +56.31% |
| p99 | 3.16ms | 0.71ms | +2.46ms | +347.62% |
| mean | 0.61ms | 0.42ms | +0.19ms | +44.98% |
| min | 0.36ms | 0.35ms | +0.0039ms | +1.09% |
| max | 3.72ms | 0.73ms | +2.99ms | +406.37% |
| total | 12.12ms | 8.36ms | +3.76ms | +44.98% |

### mount_error_handling (3 throw + catch during render)

# Perf Report — mount_error_handling (3 throw + catch during render).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.81ms |
| p50 | 0.98ms |
| p95 | 3.24ms |
| p99 | 3.62ms |
| mean | 1.34ms |
| stdev | 0.86ms |
| min | 0.80ms |
| max | 3.71ms |
| total | 26.78ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.898)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.72ms | 0.80ms | -0.07ms | -9.28% |
| p50 | 0.88ms | 0.87ms | +0.0061ms | +0.71% |
| p95 | 2.90ms | 1.55ms | +1.35ms | +87.24% |
| p99 | 3.25ms | 4.24ms | -1.00ms | -23.53% |
| mean | 1.20ms | 1.11ms | +0.10ms | +8.66% |
| min | 0.72ms | 0.76ms | -0.04ms | -5.24% |
| max | 3.33ms | 4.92ms | -1.59ms | -32.27% |
| total | 24.04ms | 22.12ms | +1.92ms | +8.66% |

