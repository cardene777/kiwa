# Perf Suite — search

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| meiliSearchQuery | 0.01ms | 0.03ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| algoliaSearchQuery | 0.0071ms | 0.0083ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| typesenseSearchQuery | 0.0067ms | 0.01ms | 10ms | 0.00033ms | PASS | stable (p10 +1% (閾値未満)、 p95 +51% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| meiliAddDocuments | 0.00038ms | 0.00072ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| algoliaAddDocuments | 0.00038ms | 0.00071ms | 10ms | 0.00033ms | PASS | stable (p10 +13% (閾値未満)、 p95 +22% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| typesenseAddDocuments | 0.00033ms | 0.00096ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| meiliSearchQuery | 0.15ms | 20ms | PASS |
| algoliaSearchQuery | 0.16ms | 20ms | PASS |
| typesenseSearchQuery | 0.17ms | 20ms | PASS |
| meiliAddDocuments | 0.01ms | 20ms | PASS |
| algoliaAddDocuments | 0.01ms | 20ms | PASS |
| typesenseAddDocuments | 0.01ms | 20ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| meiliSearchQuery | 944 B | 0 B | 102400 B | yes | PASS |
| algoliaSearchQuery | -15232 B | 0 B | 102400 B | yes | PASS |
| typesenseSearchQuery | 2536 B | 0 B | 102400 B | yes | PASS |
| meiliAddDocuments | 21928 B | 0 B | 102400 B | yes | PASS |
| algoliaAddDocuments | 20016 B | 0 B | 102400 B | yes | PASS |
| typesenseAddDocuments | 15728 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### meiliSearchQuery

# Perf Report — meiliSearchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.05ms |
| mean | 0.02ms |
| stdev | 0.03ms |
| min | 0.0097ms |
| max | 0.31ms |
| total | 3.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00018ms | -1.68% |
| p50 | 0.01ms | 0.02ms | -0.0016ms | -9.83% |
| p95 | 0.03ms | 0.03ms | +0.00020ms | +0.67% |
| p99 | 0.05ms | 0.06ms | -0.01ms | -21.31% |
| mean | 0.02ms | 0.02ms | -0.0019ms | -9.50% |
| min | 0.0097ms | 0.01ms | -0.00025ms | -2.50% |
| max | 0.31ms | 0.36ms | -0.05ms | -14.51% |
| total | 3.61ms | 3.98ms | -0.38ms | -9.50% |

### algoliaSearchQuery

# Perf Report — algoliaSearchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0071ms |
| p50 | 0.0073ms |
| p95 | 0.0083ms |
| p99 | 0.01ms |
| mean | 0.0080ms |
| stdev | 0.0066ms |
| min | 0.0070ms |
| max | 0.10ms |
| total | 1.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0071ms | 0.0070ms | +0.00017ms | +2.40% |
| p50 | 0.0073ms | 0.0072ms | +0.000084ms | +1.17% |
| p95 | 0.0083ms | 0.0088ms | -0.00046ms | -5.23% |
| p99 | 0.01ms | 0.02ms | -0.0096ms | -44.21% |
| mean | 0.0080ms | 0.0085ms | -0.00045ms | -5.29% |
| min | 0.0070ms | 0.0069ms | +0.000083ms | +1.21% |
| max | 0.10ms | 0.18ms | -0.08ms | -45.45% |
| total | 1.60ms | 1.69ms | -0.09ms | -5.29% |

### typesenseSearchQuery

# Perf Report — typesenseSearchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0067ms |
| p50 | 0.0075ms |
| p95 | 0.01ms |
| p99 | 0.04ms |
| mean | 0.0090ms |
| stdev | 0.01ms |
| min | 0.0065ms |
| max | 0.15ms |
| total | 1.80ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0067ms | 0.0067ms | +0.000042ms | +0.63% |
| p50 | 0.0075ms | 0.0068ms | +0.00071ms | +10.36% |
| p95 | 0.01ms | 0.0075ms | +0.0038ms | +50.98% |
| p99 | 0.04ms | 0.02ms | +0.02ms | +116.10% |
| mean | 0.0090ms | 0.0075ms | +0.0015ms | +20.44% |
| min | 0.0065ms | 0.0065ms | -0.000041ms | -0.63% |
| max | 0.15ms | 0.09ms | +0.06ms | +61.72% |
| total | 1.80ms | 1.49ms | +0.31ms | +20.44% |

### meiliAddDocuments

# Perf Report — meiliAddDocuments.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00038ms |
| p95 | 0.00072ms |
| p99 | 0.0025ms |
| mean | 0.00051ms |
| stdev | 0.00063ms |
| min | 0.00033ms |
| max | 0.0067ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| p50 | 0.00038ms | 0.00046ms | -0.000083ms | -18.12% |
| p95 | 0.00072ms | 0.00063ms | +0.000093ms | +14.95% |
| p99 | 0.0025ms | 0.0031ms | -0.00056ms | -18.20% |
| mean | 0.00051ms | 0.00055ms | -0.000040ms | -7.29% |
| min | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| max | 0.0067ms | 0.0083ms | -0.0015ms | -18.18% |
| total | 0.10ms | 0.11ms | -0.0080ms | -7.29% |

### algoliaAddDocuments

# Perf Report — algoliaAddDocuments.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00038ms |
| p95 | 0.00071ms |
| p99 | 0.0025ms |
| mean | 0.00050ms |
| stdev | 0.00063ms |
| min | 0.00033ms |
| max | 0.0073ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00033ms | +0.000042ms | +12.61% |
| p50 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p95 | 0.00071ms | 0.00058ms | +0.00013ms | +21.80% |
| p99 | 0.0025ms | 0.0021ms | +0.00035ms | +16.29% |
| mean | 0.00050ms | 0.00045ms | +0.000050ms | +11.22% |
| min | 0.00033ms | 0.00025ms | +0.000083ms | +33.20% |
| max | 0.0073ms | 0.0068ms | +0.00050ms | +7.32% |
| total | 0.10ms | 0.09ms | +0.01ms | +11.22% |

### typesenseAddDocuments

# Perf Report — typesenseAddDocuments.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.00096ms |
| p99 | 0.0055ms |
| mean | 0.0011ms |
| stdev | 0.0086ms |
| min | 0.00033ms |
| max | 0.12ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| p50 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p95 | 0.00096ms | 0.0016ms | -0.00063ms | -39.70% |
| p99 | 0.0055ms | 0.0078ms | -0.0023ms | -29.34% |
| mean | 0.0011ms | 0.00066ms | +0.00043ms | +65.01% |
| min | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| max | 0.12ms | 0.01ms | +0.11ms | +747.37% |
| total | 0.22ms | 0.13ms | +0.09ms | +65.01% |

