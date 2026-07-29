# Perf Suite — search

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| meiliSearchQuery | 0.010ms | 0.03ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| algoliaSearchQuery | 0.0066ms | 0.0077ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| typesenseSearchQuery | 0.0065ms | 0.01ms | 10ms | 0.00033ms | PASS | stable (p10 -4% (閾値未満)、 p95 +55% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| meiliAddDocuments | 0.00033ms | 0.00071ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| algoliaAddDocuments | 0.00033ms | 0.00055ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| typesenseAddDocuments | 0.00029ms | 0.00063ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| meiliSearchQuery | 0.12ms | 20ms | PASS |
| algoliaSearchQuery | 0.14ms | 20ms | PASS |
| typesenseSearchQuery | 0.13ms | 20ms | PASS |
| meiliAddDocuments | 0.01ms | 20ms | PASS |
| algoliaAddDocuments | 0.01ms | 20ms | PASS |
| typesenseAddDocuments | 0.01ms | 20ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| meiliSearchQuery | 1160 B | 0 B | 102400 B | yes | PASS |
| algoliaSearchQuery | -15232 B | 0 B | 102400 B | yes | PASS |
| typesenseSearchQuery | 4280 B | 0 B | 102400 B | yes | PASS |
| meiliAddDocuments | 15112 B | 0 B | 102400 B | yes | PASS |
| algoliaAddDocuments | 18744 B | 0 B | 102400 B | yes | PASS |
| typesenseAddDocuments | 15632 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### meiliSearchQuery

# Perf Report — meiliSearchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.010ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.06ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.0097ms |
| max | 0.26ms |
| total | 3.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.010ms | 0.01ms | -0.00046ms | -4.40% |
| p50 | 0.01ms | 0.02ms | -0.0014ms | -8.91% |
| p95 | 0.03ms | 0.03ms | -0.00054ms | -1.76% |
| p99 | 0.06ms | 0.06ms | -0.00029ms | -0.49% |
| mean | 0.02ms | 0.02ms | -0.0023ms | -11.38% |
| min | 0.0097ms | 0.01ms | -0.00025ms | -2.50% |
| max | 0.26ms | 0.36ms | -0.10ms | -27.87% |
| total | 3.53ms | 3.98ms | -0.45ms | -11.38% |

### algoliaSearchQuery

# Perf Report — algoliaSearchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0066ms |
| p50 | 0.0068ms |
| p95 | 0.0077ms |
| p99 | 0.0092ms |
| mean | 0.0073ms |
| stdev | 0.0052ms |
| min | 0.0065ms |
| max | 0.08ms |
| total | 1.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0066ms | 0.0070ms | -0.00033ms | -4.79% |
| p50 | 0.0068ms | 0.0072ms | -0.00042ms | -5.79% |
| p95 | 0.0077ms | 0.0088ms | -0.0011ms | -12.43% |
| p99 | 0.0092ms | 0.02ms | -0.01ms | -57.59% |
| mean | 0.0073ms | 0.0085ms | -0.0011ms | -13.53% |
| min | 0.0065ms | 0.0069ms | -0.00042ms | -6.07% |
| max | 0.08ms | 0.18ms | -0.10ms | -56.62% |
| total | 1.46ms | 1.69ms | -0.23ms | -13.53% |

### typesenseSearchQuery

# Perf Report — typesenseSearchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0065ms |
| p50 | 0.0068ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0082ms |
| stdev | 0.0069ms |
| min | 0.0063ms |
| max | 0.10ms |
| total | 1.65ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0065ms | 0.0067ms | -0.00025ms | -3.73% |
| p50 | 0.0068ms | 0.0068ms | -0.000043ms | -0.63% |
| p95 | 0.01ms | 0.0075ms | +0.0041ms | +54.86% |
| p99 | 0.02ms | 0.02ms | -0.000021ms | -0.12% |
| mean | 0.0082ms | 0.0075ms | +0.00079ms | +10.53% |
| min | 0.0063ms | 0.0065ms | -0.00029ms | -4.45% |
| max | 0.10ms | 0.09ms | +0.01ms | +12.76% |
| total | 1.65ms | 1.49ms | +0.16ms | +10.53% |

### meiliAddDocuments

# Perf Report — meiliAddDocuments.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.00071ms |
| p99 | 0.0023ms |
| mean | 0.00049ms |
| stdev | 0.00065ms |
| min | 0.00033ms |
| max | 0.0077ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00042ms | -0.000083ms | -19.95% |
| p50 | 0.00038ms | 0.00046ms | -0.000083ms | -18.12% |
| p95 | 0.00071ms | 0.00063ms | +0.000086ms | +13.77% |
| p99 | 0.0023ms | 0.0031ms | -0.00082ms | -26.52% |
| mean | 0.00049ms | 0.00055ms | -0.000059ms | -10.71% |
| min | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| max | 0.0077ms | 0.0083ms | -0.00058ms | -7.07% |
| total | 0.10ms | 0.11ms | -0.01ms | -10.71% |

### algoliaAddDocuments

# Perf Report — algoliaAddDocuments.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00033ms |
| p95 | 0.00055ms |
| p99 | 0.0021ms |
| mean | 0.00045ms |
| stdev | 0.00056ms |
| min | 0.00029ms |
| max | 0.0074ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| p50 | 0.00033ms | 0.00038ms | -0.000041ms | -10.93% |
| p95 | 0.00055ms | 0.00058ms | -0.000035ms | -5.96% |
| p99 | 0.0021ms | 0.0021ms | -0.0000083ms | -0.39% |
| mean | 0.00045ms | 0.00045ms | -0.0000044ms | -0.97% |
| min | 0.00029ms | 0.00025ms | +0.000042ms | +16.80% |
| max | 0.0074ms | 0.0068ms | +0.00054ms | +7.92% |
| total | 0.09ms | 0.09ms | -0.00088ms | -0.97% |

### typesenseAddDocuments

# Perf Report — typesenseAddDocuments.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00063ms |
| p99 | 0.0016ms |
| mean | 0.00041ms |
| stdev | 0.00048ms |
| min | 0.00029ms |
| max | 0.0065ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00033ms | -0.000041ms | -12.31% |
| p50 | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| p95 | 0.00063ms | 0.0016ms | -0.00097ms | -60.62% |
| p99 | 0.0016ms | 0.0078ms | -0.0062ms | -79.68% |
| mean | 0.00041ms | 0.00066ms | -0.00025ms | -38.39% |
| min | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| max | 0.0065ms | 0.01ms | -0.0079ms | -54.62% |
| total | 0.08ms | 0.13ms | -0.05ms | -38.39% |

