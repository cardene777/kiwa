# Perf Suite — design-check

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00020ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00041ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| checkSpecConformance | 0.0022ms | 0.0048ms | 5ms | 0.00037ms | PASS | stable — gate 無効 (regressionGate=false) |
| checkLayoutRegression | 0.0063ms | 0.03ms | 5ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| checkSpecConformance | cpu | 0.09ms | 0.10ms | 0.0022ms | 0.024 | 0.026 | n/a | 20.0% | 0.0020ms | 0.0021ms |
| checkLayoutRegression | cpu | 0.09ms | 0.14ms | 0.0063ms | 0.070 | 0.074 | n/a | 20.0% | 0.0063ms | 0.0066ms |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| checkSpecConformance | 0.01ms | 10ms | PASS |
| checkLayoutRegression | 0.03ms | 10ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| checkSpecConformance | -59816 B | 0 B | 102400 B | yes | 55 (5 + 50) | PASS |
| checkLayoutRegression | -1512 B | 0 B | 102400 B | yes | 55 (5 + 50) | PASS |

## Detailed serial reports

### checkSpecConformance

# Perf Report — checkSpecConformance.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0024ms |
| p95 | 0.0048ms |
| p99 | 0.0063ms |
| mean | 0.0028ms |
| stdev | 0.00098ms |
| min | 0.0022ms |
| max | 0.0063ms |
| total | 0.14ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.911)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0020ms | 0.0021ms | -0.00012ms | -5.53% |
| p50 | 0.0022ms | 0.0022ms | -0.000087ms | -3.85% |
| p95 | 0.0044ms | 0.0068ms | -0.0024ms | -35.73% |
| p99 | 0.0057ms | 0.01ms | -0.0071ms | -55.41% |
| mean | 0.0025ms | 0.0032ms | -0.00066ms | -20.78% |
| min | 0.0020ms | 0.0021ms | -0.00011ms | -5.24% |
| max | 0.0057ms | 0.02ms | -0.01ms | -66.04% |
| total | 0.13ms | 0.16ms | -0.03ms | -20.78% |

### checkLayoutRegression

# Perf Report — checkLayoutRegression.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 5 |
| p10 | 0.0063ms |
| p50 | 0.0072ms |
| p95 | 0.03ms |
| p99 | 0.07ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0062ms |
| max | 0.09ms |
| total | 0.62ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.001)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0063ms | 0.0066ms | -0.00033ms | -4.97% |
| p50 | 0.0072ms | 0.0067ms | +0.00042ms | +6.28% |
| p95 | 0.03ms | 0.03ms | +0.0038ms | +12.25% |
| p99 | 0.07ms | 0.03ms | +0.04ms | +112.12% |
| mean | 0.01ms | 0.01ms | +0.0016ms | +14.37% |
| min | 0.0062ms | 0.0065ms | -0.00033ms | -5.02% |
| max | 0.09ms | 0.04ms | +0.06ms | +155.50% |
| total | 0.62ms | 0.54ms | +0.08ms | +14.37% |

