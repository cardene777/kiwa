# Perf Suite — search

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| meiliSearchQuery | 0.01ms | 0.03ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| algoliaSearchQuery | 0.0068ms | 0.0085ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| typesenseSearchQuery | 0.0064ms | 0.0081ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| meiliAddDocuments | 0.00033ms | 0.00083ms | 10ms | 0.00033ms | PASS | stable (p10 -20% (閾値未満)、 p95 +33% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| algoliaAddDocuments | 0.00029ms | 0.00067ms | 10ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +100%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| typesenseAddDocuments | 0.00033ms | 0.00063ms | 10ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +100%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| meiliSearchQuery | 0.15ms | 20ms | PASS |
| algoliaSearchQuery | 0.12ms | 20ms | PASS |
| typesenseSearchQuery | 0.11ms | 20ms | PASS |
| meiliAddDocuments | 0.02ms | 20ms | PASS |
| algoliaAddDocuments | 0.01ms | 20ms | PASS |
| typesenseAddDocuments | 0.01ms | 20ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| meiliSearchQuery | 1184 B | 0 B | 102400 B | yes | PASS |
| algoliaSearchQuery | -15232 B | 0 B | 102400 B | yes | PASS |
| typesenseSearchQuery | 4504 B | 0 B | 102400 B | yes | PASS |
| meiliAddDocuments | 15144 B | 0 B | 102400 B | yes | PASS |
| algoliaAddDocuments | 15248 B | 0 B | 102400 B | yes | PASS |
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
| p99 | 0.07ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.0097ms |
| max | 0.26ms |
| total | 3.56ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00034ms | -3.25% |
| p50 | 0.01ms | 0.02ms | -0.0014ms | -8.65% |
| p95 | 0.03ms | 0.03ms | -0.0011ms | -3.49% |
| p99 | 0.07ms | 0.06ms | +0.0078ms | +13.39% |
| mean | 0.02ms | 0.02ms | -0.0021ms | -10.67% |
| min | 0.0097ms | 0.01ms | -0.00029ms | -2.92% |
| max | 0.26ms | 0.36ms | -0.10ms | -28.35% |
| total | 3.56ms | 3.98ms | -0.43ms | -10.67% |

### algoliaSearchQuery

# Perf Report — algoliaSearchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0068ms |
| p50 | 0.0070ms |
| p95 | 0.0085ms |
| p99 | 0.02ms |
| mean | 0.0075ms |
| stdev | 0.0045ms |
| min | 0.0066ms |
| max | 0.07ms |
| total | 1.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0068ms | 0.0070ms | -0.00017ms | -2.40% |
| p50 | 0.0070ms | 0.0072ms | -0.00025ms | -3.45% |
| p95 | 0.0085ms | 0.0088ms | -0.00029ms | -3.36% |
| p99 | 0.02ms | 0.02ms | -0.0065ms | -30.24% |
| mean | 0.0075ms | 0.0085ms | -0.00091ms | -10.82% |
| min | 0.0066ms | 0.0069ms | -0.00025ms | -3.64% |
| max | 0.07ms | 0.18ms | -0.11ms | -61.89% |
| total | 1.51ms | 1.69ms | -0.18ms | -10.82% |

### typesenseSearchQuery

# Perf Report — typesenseSearchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0064ms |
| p50 | 0.0065ms |
| p95 | 0.0081ms |
| p99 | 0.02ms |
| mean | 0.0072ms |
| stdev | 0.0050ms |
| min | 0.0063ms |
| max | 0.07ms |
| total | 1.45ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0064ms | 0.0067ms | -0.00029ms | -4.34% |
| p50 | 0.0065ms | 0.0068ms | -0.00029ms | -4.27% |
| p95 | 0.0081ms | 0.0075ms | +0.00063ms | +8.39% |
| p99 | 0.02ms | 0.02ms | -0.00080ms | -4.50% |
| mean | 0.0072ms | 0.0075ms | -0.00022ms | -2.93% |
| min | 0.0063ms | 0.0065ms | -0.00029ms | -4.45% |
| max | 0.07ms | 0.09ms | -0.02ms | -17.36% |
| total | 1.45ms | 1.49ms | -0.04ms | -2.93% |

### meiliAddDocuments

# Perf Report — meiliAddDocuments.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.00083ms |
| p99 | 0.0024ms |
| mean | 0.00051ms |
| stdev | 0.00081ms |
| min | 0.00033ms |
| max | 0.0088ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00042ms | -0.000082ms | -19.71% |
| p50 | 0.00038ms | 0.00046ms | -0.000083ms | -18.12% |
| p95 | 0.00083ms | 0.00063ms | +0.00021ms | +33.28% |
| p99 | 0.0024ms | 0.0031ms | -0.00067ms | -21.67% |
| mean | 0.00051ms | 0.00055ms | -0.000036ms | -6.55% |
| min | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| max | 0.0088ms | 0.0083ms | +0.00058ms | +7.07% |
| total | 0.10ms | 0.11ms | -0.0072ms | -6.55% |

### algoliaAddDocuments

# Perf Report — algoliaAddDocuments.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00067ms |
| p99 | 0.0068ms |
| mean | 0.00083ms |
| stdev | 0.0051ms |
| min | 0.00025ms |
| max | 0.07ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00033ms | -0.000041ms | -12.31% |
| p50 | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| p95 | 0.00067ms | 0.00058ms | +0.000089ms | +15.32% |
| p99 | 0.0068ms | 0.0021ms | +0.0047ms | +220.42% |
| mean | 0.00083ms | 0.00045ms | +0.00038ms | +83.83% |
| min | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| max | 0.07ms | 0.0068ms | +0.06ms | +933.44% |
| total | 0.17ms | 0.09ms | +0.08ms | +83.83% |

### typesenseAddDocuments

# Perf Report — typesenseAddDocuments.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00033ms |
| p95 | 0.00063ms |
| p99 | 0.0027ms |
| mean | 0.00050ms |
| stdev | 0.0011ms |
| min | 0.00029ms |
| max | 0.01ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| p50 | 0.00033ms | 0.00038ms | -0.000041ms | -10.93% |
| p95 | 0.00063ms | 0.0016ms | -0.00097ms | -60.62% |
| p99 | 0.0027ms | 0.0078ms | -0.0051ms | -64.77% |
| mean | 0.00050ms | 0.00066ms | -0.00016ms | -24.60% |
| min | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| max | 0.01ms | 0.01ms | -0.00021ms | -1.45% |
| total | 0.10ms | 0.13ms | -0.03ms | -24.60% |

