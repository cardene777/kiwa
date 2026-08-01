# Perf Suite — ruby-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | 0.0067ms | 0.04ms | 100ms | 0.00046ms | PASS | stable (換算後 p10 +2% (閾値未満)、 p95 +219% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| multi_framework_batch (4 framework dispatch x2) | 0.0047ms | 0.02ms | 100ms | 0.00046ms | PASS | stable (換算後 p10 -1% (閾値未満)、 p95 +35% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| erb_render_missing_key (5 render + missing collect) | 0.0023ms | 0.0030ms | 100ms | 0.00045ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | cpu | 0.09ms | 0.15ms | 0.0067ms | 0.074 | 0.073 | n/a | 20.0% | 0.0061ms | 0.0060ms |
| multi_framework_batch (4 framework dispatch x2) | cpu | 0.09ms | 0.12ms | 0.0047ms | 0.053 | 0.054 | n/a | 20.0% | 0.0044ms | 0.0044ms |
| erb_render_missing_key (5 render + missing collect) | cpu | 0.09ms | 0.09ms | 0.0023ms | 0.026 | 0.025 | n/a | 20.0% | 0.0021ms | 0.0020ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | 0.04ms | 200ms | PASS |
| multi_framework_batch (4 framework dispatch x2) | 0.04ms | 200ms | PASS |
| erb_render_missing_key (5 render + missing collect) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | -208 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| multi_framework_batch (4 framework dispatch x2) | 524232 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| erb_render_missing_key (5 render + missing collect) | -2936 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### rails_crud_workflow (10 dispatch with AR log)

# Perf Report — rails_crud_workflow (10 dispatch with AR log).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0067ms |
| p50 | 0.0085ms |
| p95 | 0.04ms |
| p99 | 0.19ms |
| mean | 0.02ms |
| stdev | 0.05ms |
| min | 0.0065ms |
| max | 0.22ms |
| total | 0.44ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.910)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0061ms | 0.0060ms | +0.00014ms | +2.32% |
| p50 | 0.0078ms | 0.0065ms | +0.0012ms | +18.60% |
| p95 | 0.04ms | 0.01ms | +0.03ms | +219.44% |
| p99 | 0.17ms | 0.01ms | +0.16ms | +1330.32% |
| mean | 0.02ms | 0.0074ms | +0.01ms | +173.48% |
| min | 0.0060ms | 0.0059ms | +0.000081ms | +1.39% |
| max | 0.20ms | 0.01ms | +0.19ms | +1597.04% |
| total | 0.40ms | 0.15ms | +0.26ms | +173.48% |

### multi_framework_batch (4 framework dispatch x2)

# Perf Report — multi_framework_batch (4 framework dispatch x2).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0047ms |
| p50 | 0.0049ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0070ms |
| stdev | 0.0045ms |
| min | 0.0047ms |
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.924)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0044ms | 0.0044ms | -0.000030ms | -0.68% |
| p50 | 0.0046ms | 0.0045ms | +0.000060ms | +1.34% |
| p95 | 0.02ms | 0.01ms | +0.0041ms | +35.05% |
| p99 | 0.02ms | 0.02ms | +0.0032ms | +20.55% |
| mean | 0.0065ms | 0.0056ms | +0.00083ms | +14.85% |
| min | 0.0043ms | 0.0044ms | -0.000027ms | -0.61% |
| max | 0.02ms | 0.02ms | +0.0029ms | +17.97% |
| total | 0.13ms | 0.11ms | +0.02ms | +14.85% |

### erb_render_missing_key (5 render + missing collect)

# Perf Report — erb_render_missing_key (5 render + missing collect).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0023ms |
| p50 | 0.0024ms |
| p95 | 0.0030ms |
| p99 | 0.0041ms |
| mean | 0.0025ms |
| stdev | 0.00046ms |
| min | 0.0023ms |
| max | 0.0044ms |
| total | 0.05ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.903)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0021ms | 0.0020ms | +0.000064ms | +3.15% |
| p50 | 0.0022ms | 0.0021ms | +0.000077ms | +3.66% |
| p95 | 0.0027ms | 0.0029ms | -0.00021ms | -7.22% |
| p99 | 0.0037ms | 0.0072ms | -0.0035ms | -48.55% |
| mean | 0.0023ms | 0.0025ms | -0.00017ms | -6.84% |
| min | 0.0021ms | 0.0020ms | +0.000065ms | +3.16% |
| max | 0.0040ms | 0.0083ms | -0.0043ms | -52.16% |
| total | 0.05ms | 0.05ms | -0.0034ms | -6.84% |

