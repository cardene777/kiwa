# Perf Suite — dogfood-form-ct

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00046ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00092ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| mountAllForms | 0.05ms | 0.14ms | 50ms | 0.00087ms | PASS | stable — gate 無効 (regressionGate=false) |
| validateAllForms | 0.04ms | 0.06ms | 80ms | 0.00081ms | PASS | stable — gate 無効 (regressionGate=false) |
| submitAllForms | 0.03ms | 0.05ms | 80ms | 0.00081ms | PASS | improved — gate 無効 (regressionGate=false) |
| a11yAllForms | 0.06ms | 0.09ms | 80ms | 0.00084ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| mountAllForms | cpu | 0.09ms | 0.11ms | 0.05ms | 0.585 | 0.578 | n/a | 20.0% | 0.05ms | 0.05ms |
| validateAllForms | cpu | 0.09ms | 0.10ms | 0.04ms | 0.425 | 0.442 | n/a | 20.0% | 0.04ms | 0.04ms |
| submitAllForms | cpu | 0.09ms | 0.09ms | 0.03ms | 0.333 | 0.633 | n/a | 20.0% | 0.03ms | 0.05ms |
| a11yAllForms | cpu | 0.09ms | 0.10ms | 0.06ms | 0.682 | 0.700 | n/a | 20.0% | 0.06ms | 0.06ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| mountAllForms | 0.61ms | 100ms | PASS |
| validateAllForms | 0.48ms | 160ms | PASS |
| submitAllForms | 0.71ms | 160ms | PASS |
| a11yAllForms | 0.77ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| mountAllForms | 11776 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| validateAllForms | -3944 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| submitAllForms | -136080 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| a11yAllForms | -2032 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### mountAllForms

# Perf Report — mountAllForms.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.05ms |
| p50 | 0.07ms |
| p95 | 0.14ms |
| p99 | 0.29ms |
| mean | 0.08ms |
| stdev | 0.05ms |
| min | 0.05ms |
| max | 0.37ms |
| total | 3.33ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.948)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | +0.00058ms | +1.20% |
| p50 | 0.06ms | 0.07ms | -0.00077ms | -1.18% |
| p95 | 0.13ms | 0.13ms | +0.00014ms | +0.11% |
| p99 | 0.27ms | 0.26ms | +0.01ms | +5.62% |
| mean | 0.08ms | 0.08ms | +0.00031ms | +0.40% |
| min | 0.05ms | 0.05ms | +0.00030ms | +0.65% |
| max | 0.35ms | 0.32ms | +0.02ms | +7.56% |
| total | 3.16ms | 3.15ms | +0.01ms | +0.40% |

### validateAllForms

# Perf Report — validateAllForms.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.06ms |
| p99 | 0.13ms |
| mean | 0.05ms |
| stdev | 0.02ms |
| min | 0.04ms |
| max | 0.17ms |
| total | 1.90ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.879)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | -0.0014ms | -3.80% |
| p50 | 0.04ms | 0.04ms | -0.0016ms | -4.25% |
| p95 | 0.06ms | 0.06ms | -0.0054ms | -8.85% |
| p99 | 0.11ms | 2.25ms | -2.14ms | -95.02% |
| mean | 0.04ms | 0.13ms | -0.09ms | -68.42% |
| min | 0.03ms | 0.04ms | -0.0012ms | -3.43% |
| max | 0.15ms | 3.65ms | -3.50ms | -95.95% |
| total | 1.67ms | 5.28ms | -3.61ms | -68.42% |

### submitAllForms

# Perf Report — submitAllForms.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.05ms |
| p99 | 0.12ms |
| mean | 0.04ms |
| stdev | 0.02ms |
| min | 0.03ms |
| max | 0.14ms |
| total | 1.47ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.879)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.05ms | -0.02ms | -47.39% |
| p50 | 0.03ms | 0.06ms | -0.03ms | -55.02% |
| p95 | 0.04ms | 0.38ms | -0.34ms | -88.72% |
| p99 | 0.10ms | 0.50ms | -0.40ms | -79.79% |
| mean | 0.03ms | 0.11ms | -0.08ms | -70.03% |
| min | 0.03ms | 0.05ms | -0.02ms | -47.06% |
| max | 0.13ms | 0.56ms | -0.44ms | -77.55% |
| total | 1.30ms | 4.32ms | -3.03ms | -70.03% |

### a11yAllForms

# Perf Report — a11yAllForms.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.06ms |
| p50 | 0.07ms |
| p95 | 0.09ms |
| p99 | 0.17ms |
| mean | 0.07ms |
| stdev | 0.03ms |
| min | 0.06ms |
| max | 0.22ms |
| total | 2.95ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.914)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.06ms | 0.06ms | -0.0015ms | -2.64% |
| p50 | 0.06ms | 0.06ms | -0.0018ms | -2.88% |
| p95 | 0.08ms | 0.11ms | -0.03ms | -30.22% |
| p99 | 0.15ms | 0.21ms | -0.05ms | -25.60% |
| mean | 0.07ms | 0.07ms | -0.0047ms | -6.51% |
| min | 0.06ms | 0.06ms | -0.00074ms | -1.31% |
| max | 0.20ms | 0.22ms | -0.02ms | -9.86% |
| total | 2.70ms | 2.88ms | -0.19ms | -6.51% |

