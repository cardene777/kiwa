# Perf Suite — ruby-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | 0.0067ms | 0.02ms | 100ms | 0.00049ms | PASS | stable (換算後 p10 +9% (閾値未満)、 p95 +88% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| multi_framework_batch (4 framework dispatch x2) | 0.0055ms | 0.02ms | 100ms | 0.00048ms | PASS | regressed — gate 無効 (regressionGate=false) |
| erb_render_missing_key (5 render + missing collect) | 0.0021ms | 0.0026ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | cpu | 0.08ms | 0.11ms | 0.0067ms | 0.079 | 0.073 | 0.0065ms | 0.0060ms |
| multi_framework_batch (4 framework dispatch x2) | cpu | 0.09ms | 0.13ms | 0.0055ms | 0.064 | 0.054 | 0.0053ms | 0.0044ms |
| erb_render_missing_key (5 render + missing collect) | cpu | 0.08ms | 0.09ms | 0.0021ms | 0.025 | 0.025 | 0.0020ms | 0.0020ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | 0.04ms | 200ms | PASS |
| multi_framework_batch (4 framework dispatch x2) | 0.07ms | 200ms | PASS |
| erb_render_missing_key (5 render + missing collect) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | 1664 B | 0 B | 102400 B | yes | PASS |
| multi_framework_batch (4 framework dispatch x2) | 6128 B | 0 B | 102400 B | yes | PASS |
| erb_render_missing_key (5 render + missing collect) | -1928 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rails_crud_workflow (10 dispatch with AR log)

# Perf Report — rails_crud_workflow (10 dispatch with AR log).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0067ms |
| p50 | 0.0088ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0060ms |
| min | 0.0062ms |
| max | 0.03ms |
| total | 0.23ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.971)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0065ms | 0.0060ms | +0.00052ms | +8.62% |
| p50 | 0.0086ms | 0.0065ms | +0.0020ms | +30.79% |
| p95 | 0.02ms | 0.01ms | +0.01ms | +88.04% |
| p99 | 0.03ms | 0.01ms | +0.01ms | +122.07% |
| mean | 0.01ms | 0.0074ms | +0.0039ms | +52.94% |
| min | 0.0060ms | 0.0059ms | +0.00011ms | +1.91% |
| max | 0.03ms | 0.01ms | +0.02ms | +130.24% |
| total | 0.22ms | 0.15ms | +0.08ms | +52.94% |

### multi_framework_batch (4 framework dispatch x2)

# Perf Report — multi_framework_batch (4 framework dispatch x2).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0055ms |
| p50 | 0.0095ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0044ms |
| min | 0.0053ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.966)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0053ms | 0.0044ms | +0.00089ms | +20.08% |
| p50 | 0.0092ms | 0.0045ms | +0.0047ms | +103.45% |
| p95 | 0.02ms | 0.01ms | +0.0057ms | +48.67% |
| p99 | 0.02ms | 0.02ms | +0.0052ms | +33.66% |
| mean | 0.0098ms | 0.0056ms | +0.0042ms | +74.30% |
| min | 0.0052ms | 0.0044ms | +0.00078ms | +17.75% |
| max | 0.02ms | 0.02ms | +0.0051ms | +30.99% |
| total | 0.20ms | 0.11ms | +0.08ms | +74.30% |

### erb_render_missing_key (5 render + missing collect)

# Perf Report — erb_render_missing_key (5 render + missing collect).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0021ms |
| p50 | 0.0022ms |
| p95 | 0.0026ms |
| p99 | 0.0028ms |
| mean | 0.0023ms |
| stdev | 0.00023ms |
| min | 0.0021ms |
| max | 0.0029ms |
| total | 0.05ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.972)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0020ms | 0.0020ms | -0.000016ms | -0.76% |
| p50 | 0.0021ms | 0.0021ms | +0.0000033ms | +0.16% |
| p95 | 0.0026ms | 0.0029ms | -0.00035ms | -11.87% |
| p99 | 0.0027ms | 0.0072ms | -0.0045ms | -62.07% |
| mean | 0.0022ms | 0.0025ms | -0.00025ms | -10.32% |
| min | 0.0020ms | 0.0020ms | -0.000015ms | -0.75% |
| max | 0.0028ms | 0.0083ms | -0.0055ms | -66.45% |
| total | 0.04ms | 0.05ms | -0.0051ms | -10.32% |

