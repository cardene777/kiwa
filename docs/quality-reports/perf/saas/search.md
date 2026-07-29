# Perf Suite — search

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| meiliSearchQuery | 0.01ms | 0.03ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| algoliaSearchQuery | 0.0074ms | 0.03ms | 10ms | 0.00033ms | PASS | stable (p10 +6% (閾値未満)、 p95 +221% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| typesenseSearchQuery | 0.0067ms | 0.02ms | 10ms | 0.00033ms | PASS | stable (p10 -1% (閾値未満)、 p95 +201% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| meiliAddDocuments | 0.00042ms | 0.0043ms | 10ms | 0.00033ms | PASS | stable (p10 +0% (閾値未満)、 p95 +592% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| algoliaAddDocuments | 0.00079ms | 0.0025ms | 10ms | 0.00033ms | PASS | regressed — gate 無効 (regressionGate=false) |
| typesenseAddDocuments | 0.00083ms | 0.0014ms | 10ms | 0.00033ms | PASS | regressed — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| meiliSearchQuery | 0.29ms | 20ms | PASS |
| algoliaSearchQuery | 0.26ms | 20ms | PASS |
| typesenseSearchQuery | 0.17ms | 20ms | PASS |
| meiliAddDocuments | 0.01ms | 20ms | PASS |
| algoliaAddDocuments | 0.01ms | 20ms | PASS |
| typesenseAddDocuments | 0.04ms | 20ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| meiliSearchQuery | 1104 B | 0 B | 102400 B | yes | PASS |
| algoliaSearchQuery | -14888 B | 0 B | 102400 B | yes | PASS |
| typesenseSearchQuery | -10648 B | 0 B | 102400 B | yes | PASS |
| meiliAddDocuments | 21848 B | 0 B | 102400 B | yes | PASS |
| algoliaAddDocuments | 19496 B | 0 B | 102400 B | yes | PASS |
| typesenseAddDocuments | 14704 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### meiliSearchQuery

# Perf Report — meiliSearchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.05ms |
| mean | 0.02ms |
| stdev | 0.03ms |
| min | 0.01ms |
| max | 0.30ms |
| total | 3.88ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00041ms | +3.91% |
| p50 | 0.02ms | 0.02ms | -0.00027ms | -1.70% |
| p95 | 0.03ms | 0.03ms | -0.0013ms | -4.22% |
| p99 | 0.05ms | 0.06ms | -0.0070ms | -11.99% |
| mean | 0.02ms | 0.02ms | -0.00052ms | -2.62% |
| min | 0.01ms | 0.01ms | +0.00038ms | +3.75% |
| max | 0.30ms | 0.36ms | -0.06ms | -17.41% |
| total | 3.88ms | 3.98ms | -0.10ms | -2.62% |

### algoliaSearchQuery

# Perf Report — algoliaSearchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0074ms |
| p50 | 0.0080ms |
| p95 | 0.03ms |
| p99 | 0.07ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.0068ms |
| max | 0.22ms |
| total | 2.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0074ms | 0.0070ms | +0.00042ms | +5.99% |
| p50 | 0.0080ms | 0.0072ms | +0.00083ms | +11.57% |
| p95 | 0.03ms | 0.0088ms | +0.02ms | +221.40% |
| p99 | 0.07ms | 0.02ms | +0.05ms | +238.12% |
| mean | 0.01ms | 0.0085ms | +0.0038ms | +45.35% |
| min | 0.0068ms | 0.0069ms | -0.000041ms | -0.60% |
| max | 0.22ms | 0.18ms | +0.04ms | +19.57% |
| total | 2.46ms | 1.69ms | +0.77ms | +45.35% |

### typesenseSearchQuery

# Perf Report — typesenseSearchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0067ms |
| p50 | 0.0081ms |
| p95 | 0.02ms |
| p99 | 0.11ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.0065ms |
| max | 0.17ms |
| total | 2.68ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0067ms | 0.0067ms | -0.000041ms | -0.61% |
| p50 | 0.0081ms | 0.0068ms | +0.0012ms | +17.98% |
| p95 | 0.02ms | 0.0075ms | +0.01ms | +200.70% |
| p99 | 0.11ms | 0.02ms | +0.09ms | +503.20% |
| mean | 0.01ms | 0.0075ms | +0.0059ms | +79.59% |
| min | 0.0065ms | 0.0065ms | -0.000082ms | -1.25% |
| max | 0.17ms | 0.09ms | +0.08ms | +88.21% |
| total | 2.68ms | 1.49ms | +1.19ms | +79.59% |

### meiliAddDocuments

# Perf Report — meiliAddDocuments.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00063ms |
| p95 | 0.0043ms |
| p99 | 0.07ms |
| mean | 0.0025ms |
| stdev | 0.01ms |
| min | 0.00033ms |
| max | 0.10ms |
| total | 0.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | +0.0000010ms | +0.24% |
| p50 | 0.00063ms | 0.00046ms | +0.00017ms | +36.46% |
| p95 | 0.0043ms | 0.00063ms | +0.0037ms | +591.57% |
| p99 | 0.07ms | 0.0031ms | +0.06ms | +2018.99% |
| mean | 0.0025ms | 0.00055ms | +0.0020ms | +358.26% |
| min | 0.00033ms | 0.00038ms | -0.000041ms | -10.93% |
| max | 0.10ms | 0.0083ms | +0.09ms | +1080.81% |
| total | 0.50ms | 0.11ms | +0.39ms | +358.26% |

### algoliaAddDocuments

# Perf Report — algoliaAddDocuments.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00079ms |
| p50 | 0.00083ms |
| p95 | 0.0025ms |
| p99 | 0.01ms |
| mean | 0.0024ms |
| stdev | 0.02ms |
| min | 0.00075ms |
| max | 0.24ms |
| total | 0.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00079ms | 0.00033ms | +0.00046ms | +137.84% |
| p50 | 0.00083ms | 0.00038ms | +0.00046ms | +122.40% |
| p95 | 0.0025ms | 0.00058ms | +0.0019ms | +331.32% |
| p99 | 0.01ms | 0.0021ms | +0.01ms | +571.13% |
| mean | 0.0024ms | 0.00045ms | +0.0019ms | +425.28% |
| min | 0.00075ms | 0.00025ms | +0.00050ms | +200.00% |
| max | 0.24ms | 0.0068ms | +0.24ms | +3473.43% |
| total | 0.47ms | 0.09ms | +0.38ms | +425.28% |

### typesenseAddDocuments

# Perf Report — typesenseAddDocuments.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00083ms |
| p50 | 0.00088ms |
| p95 | 0.0014ms |
| p99 | 0.0050ms |
| mean | 0.0012ms |
| stdev | 0.0024ms |
| min | 0.00075ms |
| max | 0.03ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00083ms | 0.00033ms | +0.00050ms | +150.15% |
| p50 | 0.00088ms | 0.00038ms | +0.00050ms | +133.33% |
| p95 | 0.0014ms | 0.0016ms | -0.00021ms | -13.25% |
| p99 | 0.0050ms | 0.0078ms | -0.0028ms | -35.75% |
| mean | 0.0012ms | 0.00066ms | +0.00051ms | +77.90% |
| min | 0.00075ms | 0.00033ms | +0.00042ms | +125.23% |
| max | 0.03ms | 0.01ms | +0.02ms | +117.91% |
| total | 0.24ms | 0.13ms | +0.10ms | +77.90% |

