# Perf Suite — search

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| meiliSearchQuery | 0.01ms | 0.03ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| algoliaSearchQuery | 0.0066ms | 0.0077ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| typesenseSearchQuery | 0.0063ms | 0.0079ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| meiliAddDocuments | 0.00033ms | 0.00067ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| algoliaAddDocuments | 0.00033ms | 0.00071ms | 10ms | 0.00033ms | PASS | stable (p10 0% (閾値未満)、 p95 +21% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| typesenseAddDocuments | 0.00033ms | 0.00067ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| meiliSearchQuery | 0.14ms | 20ms | PASS |
| algoliaSearchQuery | 0.14ms | 20ms | PASS |
| typesenseSearchQuery | 0.13ms | 20ms | PASS |
| meiliAddDocuments | 0.01ms | 20ms | PASS |
| algoliaAddDocuments | 0.01ms | 20ms | PASS |
| typesenseAddDocuments | 0.01ms | 20ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| meiliSearchQuery | 1104 B | 0 B | 102400 B | yes | PASS |
| algoliaSearchQuery | -16384 B | 0 B | 102400 B | yes | PASS |
| typesenseSearchQuery | 4392 B | 0 B | 102400 B | yes | PASS |
| meiliAddDocuments | 14440 B | 0 B | 102400 B | yes | PASS |
| algoliaAddDocuments | 14320 B | 0 B | 102400 B | yes | PASS |
| typesenseAddDocuments | 15632 B | 0 B | 102400 B | yes | PASS |

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
| p99 | 0.06ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.0096ms |
| max | 0.26ms |
| total | 3.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00034ms | -3.25% |
| p50 | 0.01ms | 0.02ms | -0.0016ms | -9.96% |
| p95 | 0.03ms | 0.03ms | -0.000024ms | -0.08% |
| p99 | 0.06ms | 0.06ms | +0.0065ms | +11.22% |
| mean | 0.02ms | 0.02ms | -0.0019ms | -9.41% |
| min | 0.0096ms | 0.01ms | -0.00038ms | -3.75% |
| max | 0.26ms | 0.36ms | -0.10ms | -27.94% |
| total | 3.61ms | 3.98ms | -0.37ms | -9.41% |

### algoliaSearchQuery

# Perf Report — algoliaSearchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0066ms |
| p50 | 0.0067ms |
| p95 | 0.0077ms |
| p99 | 0.01ms |
| mean | 0.0073ms |
| stdev | 0.0048ms |
| min | 0.0065ms |
| max | 0.07ms |
| total | 1.45ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0066ms | 0.0070ms | -0.00037ms | -5.39% |
| p50 | 0.0067ms | 0.0072ms | -0.00046ms | -6.35% |
| p95 | 0.0077ms | 0.0088ms | -0.0010ms | -11.63% |
| p99 | 0.01ms | 0.02ms | -0.0090ms | -41.46% |
| mean | 0.0073ms | 0.0085ms | -0.0012ms | -14.19% |
| min | 0.0065ms | 0.0069ms | -0.00038ms | -5.45% |
| max | 0.07ms | 0.18ms | -0.11ms | -59.84% |
| total | 1.45ms | 1.69ms | -0.24ms | -14.19% |

### typesenseSearchQuery

# Perf Report — typesenseSearchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0063ms |
| p50 | 0.0065ms |
| p95 | 0.0079ms |
| p99 | 0.02ms |
| mean | 0.0075ms |
| stdev | 0.0091ms |
| min | 0.0062ms |
| max | 0.13ms |
| total | 1.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0063ms | 0.0067ms | -0.00042ms | -6.22% |
| p50 | 0.0065ms | 0.0068ms | -0.00038ms | -5.49% |
| p95 | 0.0079ms | 0.0075ms | +0.00045ms | +6.02% |
| p99 | 0.02ms | 0.02ms | +0.0025ms | +13.82% |
| mean | 0.0075ms | 0.0075ms | +0.000046ms | +0.62% |
| min | 0.0062ms | 0.0065ms | -0.00037ms | -5.72% |
| max | 0.13ms | 0.09ms | +0.04ms | +46.77% |
| total | 1.50ms | 1.49ms | +0.0093ms | +0.62% |

### meiliAddDocuments

# Perf Report — meiliAddDocuments.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.00067ms |
| p99 | 0.0027ms |
| mean | 0.00050ms |
| stdev | 0.00066ms |
| min | 0.00033ms |
| max | 0.0078ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00042ms | -0.000083ms | -19.95% |
| p50 | 0.00038ms | 0.00046ms | -0.000083ms | -18.12% |
| p95 | 0.00067ms | 0.00063ms | +0.000044ms | +7.05% |
| p99 | 0.0027ms | 0.0031ms | -0.00041ms | -13.18% |
| mean | 0.00050ms | 0.00055ms | -0.000045ms | -8.31% |
| min | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| max | 0.0078ms | 0.0083ms | -0.00042ms | -5.04% |
| total | 0.10ms | 0.11ms | -0.0091ms | -8.31% |

### algoliaAddDocuments

# Perf Report — algoliaAddDocuments.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.00071ms |
| p99 | 0.0024ms |
| mean | 0.00047ms |
| stdev | 0.00060ms |
| min | 0.00033ms |
| max | 0.0080ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| p50 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p95 | 0.00071ms | 0.00058ms | +0.00013ms | +21.44% |
| p99 | 0.0024ms | 0.0021ms | +0.00024ms | +11.17% |
| mean | 0.00047ms | 0.00045ms | +0.000022ms | +4.95% |
| min | 0.00033ms | 0.00025ms | +0.000083ms | +33.20% |
| max | 0.0080ms | 0.0068ms | +0.0012ms | +17.06% |
| total | 0.09ms | 0.09ms | +0.0045ms | +4.95% |

### typesenseAddDocuments

# Perf Report — typesenseAddDocuments.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.00067ms |
| p99 | 0.0024ms |
| mean | 0.00047ms |
| stdev | 0.00069ms |
| min | 0.00029ms |
| max | 0.0080ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| p50 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p95 | 0.00067ms | 0.0016ms | -0.00092ms | -57.85% |
| p99 | 0.0024ms | 0.0078ms | -0.0054ms | -69.68% |
| mean | 0.00047ms | 0.00066ms | -0.00019ms | -28.31% |
| min | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| max | 0.0080ms | 0.01ms | -0.0065ms | -44.80% |
| total | 0.09ms | 0.13ms | -0.04ms | -28.31% |

