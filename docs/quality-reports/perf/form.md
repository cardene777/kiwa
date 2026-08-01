# Perf Suite — form

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00046ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00092ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| validateSchema | 0.00054ms | 0.0071ms | 5ms | 0.00081ms | PASS | stable (検知には +0.00081ms (baseline 比 +175%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| registerFieldAndSubmit | 0.0068ms | 0.02ms | 5ms | 0.00078ms | PASS | stable — gate 無効 (regressionGate=false) |
| getFieldErrorAfterFailure | 0.0054ms | 0.01ms | 5ms | 0.00078ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| validateSchema | cpu | 0.09ms | 0.14ms | 0.00054ms | 0.006 | 0.006 | n/a | 20.0% | 0.00048ms | 0.00046ms |
| registerFieldAndSubmit | cpu | 0.09ms | 0.09ms | 0.0068ms | 0.072 | 0.069 | n/a | 20.0% | 0.0058ms | 0.0055ms |
| getFieldErrorAfterFailure | cpu | 0.09ms | 0.09ms | 0.0054ms | 0.057 | 0.055 | n/a | 20.0% | 0.0046ms | 0.0044ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| validateSchema | 0.01ms | 10ms | PASS |
| registerFieldAndSubmit | 0.41ms | 10ms | PASS |
| getFieldErrorAfterFailure | 0.07ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| validateSchema | -13400 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| registerFieldAndSubmit | 5960 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| getFieldErrorAfterFailure | 2464 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### validateSchema

# Perf Report — validateSchema.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00063ms |
| p95 | 0.0071ms |
| p99 | 0.02ms |
| mean | 0.0020ms |
| stdev | 0.0044ms |
| min | 0.00050ms |
| max | 0.04ms |
| total | 0.39ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.879)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00048ms | 0.00046ms | +0.000017ms | +3.61% |
| p50 | 0.00055ms | 0.00050ms | +0.000049ms | +9.88% |
| p95 | 0.0063ms | 0.0020ms | +0.0042ms | +206.42% |
| p99 | 0.02ms | 0.01ms | +0.0087ms | +83.69% |
| mean | 0.0017ms | 0.00094ms | +0.00080ms | +85.11% |
| min | 0.00044ms | 0.00033ms | +0.00011ms | +31.99% |
| max | 0.03ms | 0.01ms | +0.02ms | +173.52% |
| total | 0.35ms | 0.19ms | +0.16ms | +85.11% |

### registerFieldAndSubmit

# Perf Report — registerFieldAndSubmit.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0068ms |
| p50 | 0.0071ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0084ms |
| stdev | 0.0035ms |
| min | 0.0064ms |
| max | 0.04ms |
| total | 1.69ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.856)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0058ms | 0.0055ms | +0.00027ms | +4.91% |
| p50 | 0.0061ms | 0.0059ms | +0.00020ms | +3.36% |
| p95 | 0.01ms | 0.02ms | -0.0077ms | -37.07% |
| p99 | 0.02ms | 0.04ms | -0.02ms | -51.79% |
| mean | 0.0072ms | 0.0085ms | -0.0013ms | -15.28% |
| min | 0.0055ms | 0.0053ms | +0.00017ms | +3.12% |
| max | 0.03ms | 0.10ms | -0.07ms | -69.20% |
| total | 1.45ms | 1.71ms | -0.26ms | -15.28% |

### getFieldErrorAfterFailure

# Perf Report — getFieldErrorAfterFailure.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0054ms |
| p50 | 0.0056ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0069ms |
| stdev | 0.0065ms |
| min | 0.0051ms |
| max | 0.09ms |
| total | 1.38ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.847)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0046ms | 0.0044ms | +0.00018ms | +4.09% |
| p50 | 0.0048ms | 0.0054ms | -0.00063ms | -11.67% |
| p95 | 0.01ms | 0.02ms | -0.0079ms | -44.10% |
| p99 | 0.01ms | 0.04ms | -0.02ms | -61.29% |
| mean | 0.0058ms | 0.0073ms | -0.0015ms | -20.27% |
| min | 0.0043ms | 0.0042ms | +0.00013ms | +3.19% |
| max | 0.08ms | 0.06ms | +0.02ms | +33.62% |
| total | 1.17ms | 1.47ms | -0.30ms | -20.27% |

