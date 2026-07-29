# Perf Suite — core-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | 0.11ms | 0.20ms | 50ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 0.0035ms | 0.02ms | 50ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| spec_pool_integration (parseSpec + pool per case) | 0.0052ms | 0.01ms | 50ms | 0.00042ms | PASS | stable (p10 +9% (閾値未満)、 p95 +91% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | 0.59ms | 100ms | PASS |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 0.03ms | 100ms | PASS |
| spec_pool_integration (parseSpec + pool per case) | 0.02ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | -2392 B | 0 B | 102400 B | yes | PASS |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 299224 B | 0 B | 102400 B | yes | PASS |
| spec_pool_integration (parseSpec + pool per case) | 824 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### spec_parsing (50 parseSpec of typical spec)

# Perf Report — spec_parsing (50 parseSpec of typical spec).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.11ms |
| p50 | 0.13ms |
| p95 | 0.20ms |
| p99 | 0.23ms |
| mean | 0.14ms |
| stdev | 0.03ms |
| min | 0.10ms |
| max | 0.25ms |
| total | 4.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.11ms | 0.12ms | -0.01ms | -9.03% |
| p50 | 0.13ms | 0.15ms | -0.02ms | -15.74% |
| p95 | 0.20ms | 0.33ms | -0.13ms | -40.20% |
| p99 | 0.23ms | 0.46ms | -0.22ms | -48.86% |
| mean | 0.14ms | 0.18ms | -0.04ms | -21.32% |
| min | 0.10ms | 0.11ms | -0.01ms | -9.53% |
| max | 0.25ms | 0.51ms | -0.26ms | -51.06% |
| total | 4.23ms | 5.38ms | -1.15ms | -21.32% |

### pool_lifecycle (create + 10 borrow/release + stopAll)

# Perf Report — pool_lifecycle (create + 10 borrow/release + stopAll).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0035ms |
| p50 | 0.0040ms |
| p95 | 0.02ms |
| p99 | 0.08ms |
| mean | 0.0088ms |
| stdev | 0.02ms |
| min | 0.0035ms |
| max | 0.11ms |
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0035ms | 0.0045ms | -0.00095ms | -21.07% |
| p50 | 0.0040ms | 0.0052ms | -0.0012ms | -22.49% |
| p95 | 0.02ms | 0.0089ms | +0.0095ms | +106.17% |
| p99 | 0.08ms | 0.01ms | +0.07ms | +701.21% |
| mean | 0.0088ms | 0.0058ms | +0.0031ms | +53.48% |
| min | 0.0035ms | 0.0043ms | -0.00079ms | -18.28% |
| max | 0.11ms | 0.01ms | +0.10ms | +922.35% |
| total | 0.27ms | 0.17ms | +0.09ms | +53.48% |

### spec_pool_integration (parseSpec + pool per case)

# Perf Report — spec_pool_integration (parseSpec + pool per case).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0052ms |
| p50 | 0.0055ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0069ms |
| stdev | 0.0031ms |
| min | 0.0051ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0052ms | 0.0047ms | +0.00043ms | +8.97% |
| p50 | 0.0055ms | 0.0049ms | +0.00060ms | +12.30% |
| p95 | 0.01ms | 0.0074ms | +0.0067ms | +90.62% |
| p99 | 0.02ms | 0.01ms | +0.0038ms | +30.83% |
| mean | 0.0069ms | 0.0054ms | +0.0015ms | +28.32% |
| min | 0.0051ms | 0.0046ms | +0.00054ms | +11.83% |
| max | 0.02ms | 0.01ms | +0.0025ms | +17.67% |
| total | 0.21ms | 0.16ms | +0.05ms | +28.32% |

