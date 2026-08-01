# Perf Suite — search

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| meiliSearchQuery | 0.01ms | 0.06ms | 10ms | 0.00036ms | PASS | regressed — gate 無効 (regressionGate=false) |
| algoliaSearchQuery | 0.0077ms | 0.02ms | 10ms | 0.00036ms | PASS | stable (換算後 p10 +1% (閾値未満)、 p95 +43% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| typesenseSearchQuery | 0.0073ms | 0.0089ms | 10ms | 0.00035ms | PASS | stable — gate 無効 (regressionGate=false) |
| meiliAddDocuments | 0.00042ms | 0.00079ms | 10ms | 0.00036ms | PASS | stable — gate 無効 (regressionGate=false) |
| algoliaAddDocuments | 0.00033ms | 0.0021ms | 10ms | 0.00036ms | PASS | stable (検知には +0.00036ms (baseline 比 +124%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| typesenseAddDocuments | 0.00038ms | 0.00079ms | 10ms | 0.00036ms | PASS | stable (検知には +0.00036ms (baseline 比 +122%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| meiliSearchQuery | cpu | 0.09ms | 0.16ms | 0.01ms | 0.123 | 0.090 | n/a | 20.0% | 0.0099ms | 0.0072ms |
| algoliaSearchQuery | cpu | 0.09ms | 0.11ms | 0.0077ms | 0.083 | 0.083 | n/a | 20.0% | 0.0067ms | 0.0067ms |
| typesenseSearchQuery | cpu | 0.09ms | 0.10ms | 0.0073ms | 0.078 | 0.081 | n/a | 20.0% | 0.0062ms | 0.0065ms |
| meiliAddDocuments | cpu | 0.09ms | 0.09ms | 0.00042ms | 0.004 | 0.005 | n/a | 20.0% | 0.00036ms | 0.00038ms |
| algoliaAddDocuments | cpu | 0.09ms | 0.09ms | 0.00033ms | 0.004 | 0.004 | n/a | 20.0% | 0.00029ms | 0.00029ms |
| typesenseAddDocuments | cpu | 0.09ms | 0.10ms | 0.00038ms | 0.004 | 0.004 | n/a | 20.0% | 0.00032ms | 0.00029ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| meiliSearchQuery | 0.21ms | 20ms | PASS |
| algoliaSearchQuery | 0.22ms | 20ms | PASS |
| typesenseSearchQuery | 0.29ms | 20ms | PASS |
| meiliAddDocuments | 0.01ms | 20ms | PASS |
| algoliaAddDocuments | 0.01ms | 20ms | PASS |
| typesenseAddDocuments | 0.01ms | 20ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| meiliSearchQuery | -10792 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| algoliaSearchQuery | -16432 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| typesenseSearchQuery | 2760 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| meiliAddDocuments | 13568 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| algoliaAddDocuments | 16776 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| typesenseAddDocuments | 16680 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### meiliSearchQuery

# Perf Report — meiliSearchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.06ms |
| p99 | 0.12ms |
| mean | 0.02ms |
| stdev | 0.04ms |
| min | 0.0078ms |
| max | 0.52ms |
| total | 5.00ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.869)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0099ms | 0.0072ms | +0.0027ms | +36.93% |
| p50 | 0.01ms | 0.01ms | -0.0010ms | -6.76% |
| p95 | 0.06ms | 0.03ms | +0.03ms | +112.93% |
| p99 | 0.11ms | 0.04ms | +0.07ms | +161.78% |
| mean | 0.02ms | 0.02ms | +0.0046ms | +27.11% |
| min | 0.0068ms | 0.0069ms | -0.00011ms | -1.59% |
| max | 0.45ms | 0.24ms | +0.21ms | +89.30% |
| total | 4.34ms | 3.42ms | +0.93ms | +27.11% |

### algoliaSearchQuery

# Perf Report — algoliaSearchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0077ms |
| p50 | 0.0080ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0098ms |
| stdev | 0.01ms |
| min | 0.0076ms |
| max | 0.12ms |
| total | 1.96ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.867)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0067ms | 0.0067ms | +0.000052ms | +0.77% |
| p50 | 0.0069ms | 0.0068ms | +0.000065ms | +0.95% |
| p95 | 0.02ms | 0.01ms | +0.0047ms | +43.48% |
| p99 | 0.03ms | 0.02ms | +0.01ms | +93.13% |
| mean | 0.0085ms | 0.0080ms | +0.00044ms | +5.52% |
| min | 0.0066ms | 0.0065ms | +0.000069ms | +1.06% |
| max | 0.11ms | 0.14ms | -0.03ms | -22.83% |
| total | 1.70ms | 1.61ms | +0.09ms | +5.52% |

### typesenseSearchQuery

# Perf Report — typesenseSearchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0073ms |
| p50 | 0.0075ms |
| p95 | 0.0089ms |
| p99 | 0.04ms |
| mean | 0.0086ms |
| stdev | 0.0066ms |
| min | 0.0072ms |
| max | 0.08ms |
| total | 1.71ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.846)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0062ms | 0.0065ms | -0.00026ms | -3.98% |
| p50 | 0.0063ms | 0.0066ms | -0.00028ms | -4.27% |
| p95 | 0.0075ms | 0.01ms | -0.0029ms | -27.86% |
| p99 | 0.03ms | 0.02ms | +0.02ms | +80.86% |
| mean | 0.0072ms | 0.0077ms | -0.00049ms | -6.36% |
| min | 0.0061ms | 0.0063ms | -0.00019ms | -3.10% |
| max | 0.07ms | 0.10ms | -0.03ms | -31.27% |
| total | 1.45ms | 1.55ms | -0.10ms | -6.36% |

### meiliAddDocuments

# Perf Report — meiliAddDocuments.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.00079ms |
| p99 | 0.0023ms |
| mean | 0.00055ms |
| stdev | 0.00064ms |
| min | 0.00038ms |
| max | 0.0087ms |
| total | 0.11ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.867)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00036ms | 0.00038ms | -0.000014ms | -3.79% |
| p50 | 0.00040ms | 0.00042ms | -0.000020ms | -4.74% |
| p95 | 0.00069ms | 0.0033ms | -0.0026ms | -79.36% |
| p99 | 0.0020ms | 0.0075ms | -0.0055ms | -73.37% |
| mean | 0.00048ms | 0.00079ms | -0.00031ms | -39.22% |
| min | 0.00033ms | 0.00033ms | -0.0000078ms | -2.33% |
| max | 0.0075ms | 0.0085ms | -0.00094ms | -11.14% |
| total | 0.10ms | 0.16ms | -0.06ms | -39.22% |

### algoliaAddDocuments

# Perf Report — algoliaAddDocuments.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00042ms |
| p95 | 0.0021ms |
| p99 | 0.01ms |
| mean | 0.0019ms |
| stdev | 0.02ms |
| min | 0.00029ms |
| max | 0.22ms |
| total | 0.37ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.868)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00029ms | -0.0000019ms | -0.67% |
| p50 | 0.00036ms | 0.00033ms | +0.000028ms | +8.44% |
| p95 | 0.0018ms | 0.00067ms | +0.0011ms | +170.18% |
| p99 | 0.0091ms | 0.0058ms | +0.0034ms | +58.13% |
| mean | 0.0016ms | 0.00049ms | +0.0011ms | +227.40% |
| min | 0.00025ms | 0.00021ms | +0.000045ms | +21.44% |
| max | 0.19ms | 0.0078ms | +0.19ms | +2377.31% |
| total | 0.32ms | 0.10ms | +0.22ms | +227.40% |

### typesenseAddDocuments

# Perf Report — typesenseAddDocuments.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00079ms |
| p99 | 0.0030ms |
| mean | 0.00052ms |
| stdev | 0.00069ms |
| min | 0.00033ms |
| max | 0.0090ms |
| total | 0.10ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.856)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00032ms | 0.00029ms | +0.000029ms | +9.87% |
| p50 | 0.00036ms | 0.00033ms | +0.000023ms | +6.97% |
| p95 | 0.00068ms | 0.00076ms | -0.000079ms | -10.42% |
| p99 | 0.0026ms | 0.0041ms | -0.0016ms | -38.08% |
| mean | 0.00044ms | 0.00048ms | -0.000036ms | -7.40% |
| min | 0.00028ms | 0.00025ms | +0.000035ms | +13.95% |
| max | 0.0077ms | 0.0077ms | +0.000032ms | +0.42% |
| total | 0.09ms | 0.10ms | -0.0071ms | -7.40% |

