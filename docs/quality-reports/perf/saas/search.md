# Perf Suite — search

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| meiliSearchQuery | 0.01ms | 0.04ms | 10ms | 0.00033ms | PASS | regressed — gate 無効 (regressionGate=false) |
| algoliaSearchQuery | 0.0080ms | 0.0092ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| typesenseSearchQuery | 0.0068ms | 0.0079ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| meiliAddDocuments | 0.00042ms | 0.00084ms | 10ms | 0.00033ms | PASS | stable (p10 0% (閾値未満)、 p95 +34% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| algoliaAddDocuments | 0.00033ms | 0.00063ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| typesenseAddDocuments | 0.00033ms | 0.00063ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| meiliSearchQuery | 0.22ms | 20ms | PASS |
| algoliaSearchQuery | 0.17ms | 20ms | PASS |
| typesenseSearchQuery | 0.14ms | 20ms | PASS |
| meiliAddDocuments | 0.02ms | 20ms | PASS |
| algoliaAddDocuments | 0.01ms | 20ms | PASS |
| typesenseAddDocuments | 0.01ms | 20ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| meiliSearchQuery | 1168 B | 0 B | 102400 B | yes | PASS |
| algoliaSearchQuery | -15232 B | 0 B | 102400 B | yes | PASS |
| typesenseSearchQuery | 4280 B | 0 B | 102400 B | yes | PASS |
| meiliAddDocuments | 22120 B | 0 B | 102400 B | yes | PASS |
| algoliaAddDocuments | 19128 B | 0 B | 102400 B | yes | PASS |
| typesenseAddDocuments | 19072 B | 0 B | 102400 B | yes | PASS |

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
| p99 | 0.11ms |
| mean | 0.02ms |
| stdev | 0.05ms |
| min | 0.01ms |
| max | 0.52ms |
| total | 4.77ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.0030ms | +28.72% |
| p50 | 0.02ms | 0.02ms | +0.00050ms | +3.15% |
| p95 | 0.04ms | 0.03ms | +0.0096ms | +31.36% |
| p99 | 0.11ms | 0.06ms | +0.06ms | +97.03% |
| mean | 0.02ms | 0.02ms | +0.0040ms | +19.83% |
| min | 0.01ms | 0.01ms | +0.00038ms | +3.75% |
| max | 0.52ms | 0.36ms | +0.16ms | +43.59% |
| total | 4.77ms | 3.98ms | +0.79ms | +19.83% |

### algoliaSearchQuery

# Perf Report — algoliaSearchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0080ms |
| p50 | 0.0083ms |
| p95 | 0.0092ms |
| p99 | 0.02ms |
| mean | 0.0090ms |
| stdev | 0.0073ms |
| min | 0.0079ms |
| max | 0.11ms |
| total | 1.81ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0080ms | 0.0070ms | +0.0011ms | +15.58% |
| p50 | 0.0083ms | 0.0072ms | +0.0011ms | +15.61% |
| p95 | 0.0092ms | 0.0088ms | +0.00050ms | +5.66% |
| p99 | 0.02ms | 0.02ms | -0.0038ms | -17.63% |
| mean | 0.0090ms | 0.0085ms | +0.00059ms | +6.93% |
| min | 0.0079ms | 0.0069ms | +0.0010ms | +15.16% |
| max | 0.11ms | 0.18ms | -0.07ms | -39.73% |
| total | 1.81ms | 1.69ms | +0.12ms | +6.93% |

### typesenseSearchQuery

# Perf Report — typesenseSearchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0068ms |
| p50 | 0.0070ms |
| p95 | 0.0079ms |
| p99 | 0.02ms |
| mean | 0.0077ms |
| stdev | 0.0062ms |
| min | 0.0067ms |
| max | 0.09ms |
| total | 1.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0068ms | 0.0067ms | +0.00012ms | +1.86% |
| p50 | 0.0070ms | 0.0068ms | +0.00013ms | +1.83% |
| p95 | 0.0079ms | 0.0075ms | +0.00043ms | +5.72% |
| p99 | 0.02ms | 0.02ms | -0.00056ms | -3.14% |
| mean | 0.0077ms | 0.0075ms | +0.00023ms | +3.14% |
| min | 0.0067ms | 0.0065ms | +0.00017ms | +2.57% |
| max | 0.09ms | 0.09ms | +0.0025ms | +2.83% |
| total | 1.54ms | 1.49ms | +0.05ms | +3.14% |

### meiliAddDocuments

# Perf Report — meiliAddDocuments.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00042ms |
| p95 | 0.00084ms |
| p99 | 0.0030ms |
| mean | 0.00057ms |
| stdev | 0.00079ms |
| min | 0.00038ms |
| max | 0.0090ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p50 | 0.00042ms | 0.00046ms | -0.000041ms | -8.95% |
| p95 | 0.00084ms | 0.00063ms | +0.00021ms | +33.62% |
| p99 | 0.0030ms | 0.0031ms | -0.000065ms | -2.09% |
| mean | 0.00057ms | 0.00055ms | +0.000028ms | +5.19% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.0090ms | 0.0083ms | +0.00075ms | +9.09% |
| total | 0.11ms | 0.11ms | +0.0057ms | +5.19% |

### algoliaAddDocuments

# Perf Report — algoliaAddDocuments.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.00063ms |
| p99 | 0.0021ms |
| mean | 0.00048ms |
| stdev | 0.00056ms |
| min | 0.00033ms |
| max | 0.0074ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | +0.0000010ms | +0.30% |
| p50 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p95 | 0.00063ms | 0.00058ms | +0.000046ms | +7.92% |
| p99 | 0.0021ms | 0.0021ms | -0.0000096ms | -0.45% |
| mean | 0.00048ms | 0.00045ms | +0.000033ms | +7.32% |
| min | 0.00033ms | 0.00025ms | +0.000083ms | +33.20% |
| max | 0.0074ms | 0.0068ms | +0.00058ms | +8.53% |
| total | 0.10ms | 0.09ms | +0.0066ms | +7.32% |

### typesenseAddDocuments

# Perf Report — typesenseAddDocuments.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.00063ms |
| p99 | 0.0072ms |
| mean | 0.00097ms |
| stdev | 0.0064ms |
| min | 0.00033ms |
| max | 0.09ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| p50 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p95 | 0.00063ms | 0.0016ms | -0.00096ms | -60.49% |
| p99 | 0.0072ms | 0.0078ms | -0.00058ms | -7.44% |
| mean | 0.00097ms | 0.00066ms | +0.00031ms | +47.48% |
| min | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| max | 0.09ms | 0.01ms | +0.08ms | +527.73% |
| total | 0.19ms | 0.13ms | +0.06ms | +47.48% |

