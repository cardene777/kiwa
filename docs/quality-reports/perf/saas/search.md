# Perf Suite — search

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| meiliSearchQuery | 0.0068ms | 0.03ms | 10ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| algoliaSearchQuery | 0.0067ms | 0.01ms | 10ms | 0.00034ms | PASS | stable (p10 -2% (閾値未満)、 p95 +55% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| typesenseSearchQuery | 0.0063ms | 0.0084ms | 10ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| meiliAddDocuments | 0.00038ms | 0.0012ms | 10ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| algoliaAddDocuments | 0.00029ms | 0.00063ms | 10ms | 0.00034ms | PASS | stable (検知には +0.00034ms (baseline 比 +115%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| typesenseAddDocuments | 0.00038ms | 0.0091ms | 10ms | 0.00033ms | PASS | stable (p10 +11% (閾値未満)、 p95 +498% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| meiliSearchQuery | cpu | 0.08ms | 0.0068ms | 0.086 | 0.091 | 0.0069ms | 0.0073ms |
| algoliaSearchQuery | cpu | 0.08ms | 0.0067ms | 0.084 | 0.085 | 0.0068ms | 0.0069ms |
| typesenseSearchQuery | cpu | 0.08ms | 0.0063ms | 0.079 | 0.079 | 0.0065ms | 0.0064ms |
| meiliAddDocuments | cpu | 0.08ms | 0.00038ms | 0.005 | 0.005 | 0.00038ms | 0.00038ms |
| algoliaAddDocuments | cpu | 0.08ms | 0.00029ms | 0.004 | 0.004 | 0.00030ms | 0.00029ms |
| typesenseAddDocuments | cpu | 0.08ms | 0.00038ms | 0.005 | 0.004 | 0.00037ms | 0.00033ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| meiliSearchQuery | 0.12ms | 20ms | PASS |
| algoliaSearchQuery | 0.13ms | 20ms | PASS |
| typesenseSearchQuery | 0.08ms | 20ms | PASS |
| meiliAddDocuments | 0.02ms | 20ms | PASS |
| algoliaAddDocuments | 0.01ms | 20ms | PASS |
| typesenseAddDocuments | 0.05ms | 20ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| meiliSearchQuery | -6760 B | 0 B | 102400 B | yes | PASS |
| algoliaSearchQuery | -15200 B | 0 B | 102400 B | yes | PASS |
| typesenseSearchQuery | 4920 B | 0 B | 102400 B | yes | PASS |
| meiliAddDocuments | 22152 B | 0 B | 102400 B | yes | PASS |
| algoliaAddDocuments | 15280 B | 0 B | 102400 B | yes | PASS |
| typesenseAddDocuments | 15760 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### meiliSearchQuery

# Perf Report — meiliSearchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0068ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.08ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.0067ms |
| max | 0.25ms |
| total | 3.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0068ms | 0.0073ms | -0.00050ms | -6.78% |
| p50 | 0.01ms | 0.01ms | +0.00050ms | +3.51% |
| p95 | 0.03ms | 0.04ms | -0.0092ms | -24.91% |
| p99 | 0.08ms | 0.17ms | -0.10ms | -56.00% |
| mean | 0.02ms | 0.02ms | -0.0024ms | -12.11% |
| min | 0.0067ms | 0.0070ms | -0.00037ms | -5.31% |
| max | 0.25ms | 0.43ms | -0.19ms | -43.49% |
| total | 3.50ms | 3.98ms | -0.48ms | -12.11% |

### algoliaSearchQuery

# Perf Report — algoliaSearchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0067ms |
| p50 | 0.0072ms |
| p95 | 0.01ms |
| p99 | 0.04ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.0066ms |
| max | 0.33ms |
| total | 2.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0067ms | 0.0069ms | -0.00021ms | -3.03% |
| p50 | 0.0072ms | 0.0072ms | -5.0e-7ms | -0.01% |
| p95 | 0.01ms | 0.0097ms | +0.0052ms | +53.10% |
| p99 | 0.04ms | 0.02ms | +0.01ms | +56.97% |
| mean | 0.01ms | 0.0084ms | +0.0021ms | +25.13% |
| min | 0.0066ms | 0.0066ms | -0.000042ms | -0.63% |
| max | 0.33ms | 0.15ms | +0.18ms | +117.43% |
| total | 2.11ms | 1.68ms | +0.42ms | +25.13% |

### typesenseSearchQuery

# Perf Report — typesenseSearchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0063ms |
| p50 | 0.0065ms |
| p95 | 0.0084ms |
| p99 | 0.02ms |
| mean | 0.0072ms |
| stdev | 0.0049ms |
| min | 0.0063ms |
| max | 0.07ms |
| total | 1.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0063ms | 0.0064ms | -0.000083ms | -1.29% |
| p50 | 0.0065ms | 0.0067ms | -0.00017ms | -2.49% |
| p95 | 0.0084ms | 0.0094ms | -0.00092ms | -9.86% |
| p99 | 0.02ms | 0.03ms | -0.0080ms | -27.44% |
| mean | 0.0072ms | 0.0081ms | -0.00087ms | -10.71% |
| min | 0.0063ms | 0.0063ms | 0.00ms | 0.00% |
| max | 0.07ms | 0.16ms | -0.09ms | -55.53% |
| total | 1.44ms | 1.62ms | -0.17ms | -10.71% |

### meiliAddDocuments

# Perf Report — meiliAddDocuments.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.0012ms |
| p99 | 0.0033ms |
| mean | 0.00056ms |
| stdev | 0.00064ms |
| min | 0.00033ms |
| max | 0.0062ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p50 | 0.00042ms | 0.00048ms | -0.000063ms | -13.03% |
| p95 | 0.0012ms | 0.0020ms | -0.00083ms | -41.52% |
| p99 | 0.0033ms | 0.01ms | -0.0076ms | -69.90% |
| mean | 0.00056ms | 0.00086ms | -0.00030ms | -34.96% |
| min | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| max | 0.0062ms | 0.02ms | -0.01ms | -64.78% |
| total | 0.11ms | 0.17ms | -0.06ms | -34.96% |

### algoliaAddDocuments

# Perf Report — algoliaAddDocuments.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00063ms |
| p99 | 0.0041ms |
| mean | 0.00048ms |
| stdev | 0.00074ms |
| min | 0.00029ms |
| max | 0.0085ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| p50 | 0.00033ms | 0.00038ms | -0.000041ms | -10.93% |
| p95 | 0.00063ms | 0.0021ms | -0.0014ms | -69.44% |
| p99 | 0.0041ms | 0.0072ms | -0.0030ms | -42.43% |
| mean | 0.00048ms | 0.00069ms | -0.00021ms | -30.36% |
| min | 0.00029ms | 0.00025ms | +0.000041ms | +16.40% |
| max | 0.0085ms | 0.01ms | -0.0019ms | -18.48% |
| total | 0.10ms | 0.14ms | -0.04ms | -30.36% |

### typesenseAddDocuments

# Perf Report — typesenseAddDocuments.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00075ms |
| p95 | 0.0091ms |
| p99 | 0.02ms |
| mean | 0.0024ms |
| stdev | 0.0056ms |
| min | 0.00029ms |
| max | 0.06ms |
| total | 0.48ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00033ms | +0.000042ms | +12.61% |
| p50 | 0.00075ms | 0.00038ms | +0.00038ms | +100.00% |
| p95 | 0.0091ms | 0.0015ms | +0.0076ms | +504.97% |
| p99 | 0.02ms | 0.0058ms | +0.02ms | +325.42% |
| mean | 0.0024ms | 0.00061ms | +0.0018ms | +297.54% |
| min | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| max | 0.06ms | 0.0088ms | +0.05ms | +548.14% |
| total | 0.48ms | 0.12ms | +0.36ms | +297.54% |

