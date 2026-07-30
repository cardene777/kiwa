# Perf Suite — search

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| meiliSearchQuery | 0.01ms | 0.04ms | 10ms | 0.00029ms | PASS | stable (換算後 p10 +23% (閾値未満)、 p95 +23% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| algoliaSearchQuery | 0.0080ms | 0.01ms | 10ms | 0.00029ms | PASS | stable — gate 無効 (regressionGate=false) |
| typesenseSearchQuery | 0.0075ms | 0.04ms | 10ms | 0.00028ms | PASS | stable (換算後 p10 -2% (閾値未満)、 p95 +236% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| meiliAddDocuments | 0.00042ms | 0.0029ms | 10ms | 0.00029ms | PASS | stable — gate 無効 (regressionGate=false) |
| algoliaAddDocuments | 0.00033ms | 0.0020ms | 10ms | 0.00029ms | PASS | stable (換算後 p10 -1% (閾値未満)、 p95 +165% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| typesenseAddDocuments | 0.00033ms | 0.0038ms | 10ms | 0.00030ms | PASS | stable (検知には +0.00030ms (baseline 比 +103%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| meiliSearchQuery | cpu | 0.09ms | 0.12ms | 0.01ms | 0.110 | 0.090 | 0.0089ms | 0.0072ms |
| algoliaSearchQuery | cpu | 0.09ms | 0.10ms | 0.0080ms | 0.086 | 0.083 | 0.0069ms | 0.0067ms |
| typesenseSearchQuery | cpu | 0.09ms | 0.15ms | 0.0075ms | 0.080 | 0.081 | 0.0064ms | 0.0065ms |
| meiliAddDocuments | cpu | 0.09ms | 0.10ms | 0.00042ms | 0.004 | 0.005 | 0.00036ms | 0.00038ms |
| algoliaAddDocuments | cpu | 0.09ms | 0.10ms | 0.00033ms | 0.004 | 0.004 | 0.00029ms | 0.00029ms |
| typesenseAddDocuments | cpu | 0.09ms | 0.15ms | 0.00033ms | 0.004 | 0.004 | 0.00030ms | 0.00029ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| meiliSearchQuery | 0.21ms | 20ms | PASS |
| algoliaSearchQuery | 0.14ms | 20ms | PASS |
| typesenseSearchQuery | 0.19ms | 20ms | PASS |
| meiliAddDocuments | 0.02ms | 20ms | PASS |
| algoliaAddDocuments | 0.01ms | 20ms | PASS |
| typesenseAddDocuments | 0.01ms | 20ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| meiliSearchQuery | -6728 B | 0 B | 102400 B | yes | PASS |
| algoliaSearchQuery | -15056 B | 0 B | 102400 B | yes | PASS |
| typesenseSearchQuery | 4752 B | 0 B | 102400 B | yes | PASS |
| meiliAddDocuments | 15144 B | 0 B | 102400 B | yes | PASS |
| algoliaAddDocuments | 19032 B | 0 B | 102400 B | yes | PASS |
| typesenseAddDocuments | 20120 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### meiliSearchQuery

# Perf Report — meiliSearchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.10ms |
| mean | 0.02ms |
| stdev | 0.03ms |
| min | 0.0078ms |
| max | 0.35ms |
| total | 4.30ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.864)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0089ms | 0.0072ms | +0.0016ms | +22.66% |
| p50 | 0.02ms | 0.01ms | +0.00024ms | +1.60% |
| p95 | 0.03ms | 0.03ms | +0.0061ms | +23.34% |
| p99 | 0.08ms | 0.04ms | +0.04ms | +103.09% |
| mean | 0.02ms | 0.02ms | +0.0015ms | +8.74% |
| min | 0.0068ms | 0.0069ms | -0.00015ms | -2.20% |
| max | 0.30ms | 0.24ms | +0.07ms | +27.98% |
| total | 3.71ms | 3.42ms | +0.30ms | +8.74% |

### algoliaSearchQuery

# Perf Report — algoliaSearchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0080ms |
| p50 | 0.0082ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0095ms |
| stdev | 0.01ms |
| min | 0.0078ms |
| max | 0.16ms |
| total | 1.90ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.864)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0069ms | 0.0067ms | +0.00024ms | +3.64% |
| p50 | 0.0071ms | 0.0068ms | +0.00026ms | +3.79% |
| p95 | 0.0091ms | 0.01ms | -0.0019ms | -16.97% |
| p99 | 0.02ms | 0.02ms | +0.0073ms | +47.94% |
| mean | 0.0082ms | 0.0080ms | +0.00017ms | +2.17% |
| min | 0.0068ms | 0.0065ms | +0.00023ms | +3.49% |
| max | 0.14ms | 0.14ms | +0.0016ms | +1.19% |
| total | 1.64ms | 1.61ms | +0.03ms | +2.17% |

### typesenseSearchQuery

# Perf Report — typesenseSearchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0075ms |
| p50 | 0.0077ms |
| p95 | 0.04ms |
| p99 | 0.09ms |
| mean | 0.03ms |
| stdev | 0.23ms |
| min | 0.0073ms |
| max | 3.22ms |
| total | 6.36ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.852)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0064ms | 0.0065ms | -0.00010ms | -1.59% |
| p50 | 0.0066ms | 0.0066ms | -0.000022ms | -0.33% |
| p95 | 0.03ms | 0.01ms | +0.02ms | +235.91% |
| p99 | 0.08ms | 0.02ms | +0.06ms | +323.76% |
| mean | 0.03ms | 0.0077ms | +0.02ms | +250.48% |
| min | 0.0062ms | 0.0063ms | -0.00011ms | -1.81% |
| max | 2.75ms | 0.10ms | +2.64ms | +2566.10% |
| total | 5.42ms | 1.55ms | +3.87ms | +250.48% |

### meiliAddDocuments

# Perf Report — meiliAddDocuments.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00054ms |
| p95 | 0.0029ms |
| p99 | 0.01ms |
| mean | 0.0012ms |
| stdev | 0.0033ms |
| min | 0.00038ms |
| max | 0.04ms |
| total | 0.24ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.870)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00036ms | 0.00038ms | -0.000012ms | -3.21% |
| p50 | 0.00047ms | 0.00042ms | +0.000055ms | +13.13% |
| p95 | 0.0025ms | 0.0033ms | -0.00083ms | -24.89% |
| p99 | 0.01ms | 0.0075ms | +0.0035ms | +46.77% |
| mean | 0.0010ms | 0.00079ms | +0.00025ms | +31.63% |
| min | 0.00033ms | 0.00033ms | -0.0000066ms | -1.98% |
| max | 0.03ms | 0.0085ms | +0.02ms | +294.87% |
| total | 0.21ms | 0.16ms | +0.05ms | +31.63% |

### algoliaAddDocuments

# Perf Report — algoliaAddDocuments.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00042ms |
| p95 | 0.0020ms |
| p99 | 0.0091ms |
| mean | 0.00073ms |
| stdev | 0.0015ms |
| min | 0.00029ms |
| max | 0.01ms |
| total | 0.15ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.868)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00029ms | -0.0000021ms | -0.71% |
| p50 | 0.00036ms | 0.00033ms | +0.000029ms | +8.65% |
| p95 | 0.0018ms | 0.00067ms | +0.0011ms | +165.34% |
| p99 | 0.0079ms | 0.0058ms | +0.0022ms | +37.31% |
| mean | 0.00063ms | 0.00049ms | +0.00014ms | +28.41% |
| min | 0.00025ms | 0.00021ms | +0.000044ms | +21.39% |
| max | 0.01ms | 0.0078ms | +0.0032ms | +40.30% |
| total | 0.13ms | 0.10ms | +0.03ms | +28.41% |

### typesenseAddDocuments

# Perf Report — typesenseAddDocuments.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00046ms |
| p95 | 0.0038ms |
| p99 | 0.01ms |
| mean | 0.0011ms |
| stdev | 0.0025ms |
| min | 0.00029ms |
| max | 0.03ms |
| total | 0.22ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.901)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00030ms | 0.00029ms | +0.0000079ms | +2.71% |
| p50 | 0.00041ms | 0.00033ms | +0.000079ms | +23.68% |
| p95 | 0.0034ms | 0.00076ms | +0.0026ms | +346.37% |
| p99 | 0.01ms | 0.0041ms | +0.0060ms | +143.65% |
| mean | 0.0010ms | 0.00048ms | +0.00052ms | +108.43% |
| min | 0.00026ms | 0.00025ms | +0.000012ms | +4.83% |
| max | 0.02ms | 0.0077ms | +0.02ms | +211.29% |
| total | 0.20ms | 0.10ms | +0.10ms | +108.43% |

