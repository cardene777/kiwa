# Perf Suite — search

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| meiliSearchQuery | 0.0099ms | 0.03ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| algoliaSearchQuery | 0.0068ms | 0.01ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| typesenseSearchQuery | 0.0064ms | 0.0077ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| meiliAddDocuments | 0.00038ms | 0.00079ms | 10ms | 0.00033ms | PASS | stable (p10 -10% (閾値未満)、 p95 +27% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| algoliaAddDocuments | 0.00033ms | 0.00071ms | 10ms | 0.00033ms | PASS | stable (p10 0% (閾値未満)、 p95 +22% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| typesenseAddDocuments | 0.00029ms | 0.00063ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| meiliSearchQuery | 0.19ms | 20ms | PASS |
| algoliaSearchQuery | 0.17ms | 20ms | PASS |
| typesenseSearchQuery | 0.12ms | 20ms | PASS |
| meiliAddDocuments | 0.01ms | 20ms | PASS |
| algoliaAddDocuments | 0.01ms | 20ms | PASS |
| typesenseAddDocuments | 0.02ms | 20ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| meiliSearchQuery | 1104 B | 0 B | 102400 B | yes | PASS |
| algoliaSearchQuery | -16336 B | 0 B | 102400 B | yes | PASS |
| typesenseSearchQuery | 4280 B | 0 B | 102400 B | yes | PASS |
| meiliAddDocuments | 14088 B | 0 B | 102400 B | yes | PASS |
| algoliaAddDocuments | 14992 B | 0 B | 102400 B | yes | PASS |
| typesenseAddDocuments | 14608 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### meiliSearchQuery

# Perf Report — meiliSearchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0099ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.09ms |
| mean | 0.02ms |
| stdev | 0.03ms |
| min | 0.0096ms |
| max | 0.30ms |
| total | 3.75ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0099ms | 0.01ms | -0.00050ms | -4.80% |
| p50 | 0.01ms | 0.02ms | -0.00090ms | -5.64% |
| p95 | 0.03ms | 0.03ms | +0.000068ms | +0.22% |
| p99 | 0.09ms | 0.06ms | +0.03ms | +53.76% |
| mean | 0.02ms | 0.02ms | -0.0012ms | -5.90% |
| min | 0.0096ms | 0.01ms | -0.00042ms | -4.16% |
| max | 0.30ms | 0.36ms | -0.06ms | -15.43% |
| total | 3.75ms | 3.98ms | -0.24ms | -5.90% |

### algoliaSearchQuery

# Perf Report — algoliaSearchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0068ms |
| p50 | 0.0072ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0085ms |
| stdev | 0.01ms |
| min | 0.0067ms |
| max | 0.15ms |
| total | 1.70ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0068ms | 0.0070ms | -0.00013ms | -1.80% |
| p50 | 0.0072ms | 0.0072ms | -0.000041ms | -0.57% |
| p95 | 0.01ms | 0.0088ms | +0.0016ms | +18.63% |
| p99 | 0.03ms | 0.02ms | +0.0058ms | +26.95% |
| mean | 0.0085ms | 0.0085ms | +0.000052ms | +0.62% |
| min | 0.0067ms | 0.0069ms | -0.00017ms | -2.43% |
| max | 0.15ms | 0.18ms | -0.04ms | -19.68% |
| total | 1.70ms | 1.69ms | +0.01ms | +0.62% |

### typesenseSearchQuery

# Perf Report — typesenseSearchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0064ms |
| p50 | 0.0067ms |
| p95 | 0.0077ms |
| p99 | 0.02ms |
| mean | 0.0073ms |
| stdev | 0.0052ms |
| min | 0.0063ms |
| max | 0.08ms |
| total | 1.45ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0064ms | 0.0067ms | -0.00030ms | -4.41% |
| p50 | 0.0067ms | 0.0068ms | -0.00017ms | -2.46% |
| p95 | 0.0077ms | 0.0075ms | +0.00025ms | +3.37% |
| p99 | 0.02ms | 0.02ms | -0.0012ms | -6.75% |
| mean | 0.0073ms | 0.0075ms | -0.00020ms | -2.70% |
| min | 0.0063ms | 0.0065ms | -0.00029ms | -4.45% |
| max | 0.08ms | 0.09ms | -0.01ms | -14.57% |
| total | 1.45ms | 1.49ms | -0.04ms | -2.70% |

### meiliAddDocuments

# Perf Report — meiliAddDocuments.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00079ms |
| p99 | 0.0056ms |
| mean | 0.0011ms |
| stdev | 0.0077ms |
| min | 0.00033ms |
| max | 0.11ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| p50 | 0.00042ms | 0.00046ms | -0.000042ms | -9.17% |
| p95 | 0.00079ms | 0.00063ms | +0.00017ms | +26.57% |
| p99 | 0.0056ms | 0.0031ms | +0.0025ms | +82.41% |
| mean | 0.0011ms | 0.00055ms | +0.00051ms | +92.46% |
| min | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| max | 0.11ms | 0.0083ms | +0.10ms | +1220.70% |
| total | 0.21ms | 0.11ms | +0.10ms | +92.46% |

### algoliaAddDocuments

# Perf Report — algoliaAddDocuments.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00033ms |
| p95 | 0.00071ms |
| p99 | 0.0025ms |
| mean | 0.00044ms |
| stdev | 0.00055ms |
| min | 0.00029ms |
| max | 0.0069ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| p50 | 0.00033ms | 0.00038ms | -0.000041ms | -10.93% |
| p95 | 0.00071ms | 0.00058ms | +0.00013ms | +22.32% |
| p99 | 0.0025ms | 0.0021ms | +0.00040ms | +18.92% |
| mean | 0.00044ms | 0.00045ms | -0.0000056ms | -1.25% |
| min | 0.00029ms | 0.00025ms | +0.000041ms | +16.40% |
| max | 0.0069ms | 0.0068ms | +0.000041ms | +0.60% |
| total | 0.09ms | 0.09ms | -0.0011ms | -1.25% |

### typesenseAddDocuments

# Perf Report — typesenseAddDocuments.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00063ms |
| p99 | 0.0018ms |
| mean | 0.00041ms |
| stdev | 0.00051ms |
| min | 0.00029ms |
| max | 0.0067ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00033ms | -0.000041ms | -12.31% |
| p50 | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| p95 | 0.00063ms | 0.0016ms | -0.00096ms | -60.49% |
| p99 | 0.0018ms | 0.0078ms | -0.0060ms | -77.48% |
| mean | 0.00041ms | 0.00066ms | -0.00025ms | -37.79% |
| min | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| max | 0.0067ms | 0.01ms | -0.0077ms | -53.47% |
| total | 0.08ms | 0.13ms | -0.05ms | -37.79% |

