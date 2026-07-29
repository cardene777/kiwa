# Perf Suite — core-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | 0.11ms | 0.21ms | 50ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 0.0036ms | 0.01ms | 50ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| spec_pool_integration (parseSpec + pool per case) | 0.0052ms | 0.01ms | 50ms | 0.00042ms | PASS | stable (p10 +9% (閾値未満)、 p95 +70% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | 0.61ms | 100ms | PASS |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 0.02ms | 100ms | PASS |
| spec_pool_integration (parseSpec + pool per case) | 0.02ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | -2952 B | 0 B | 102400 B | yes | PASS |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 8336 B | 0 B | 102400 B | yes | PASS |
| spec_pool_integration (parseSpec + pool per case) | 1264 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### spec_parsing (50 parseSpec of typical spec)

# Perf Report — spec_parsing (50 parseSpec of typical spec).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.11ms |
| p50 | 0.14ms |
| p95 | 0.21ms |
| p99 | 0.29ms |
| mean | 0.15ms |
| stdev | 0.05ms |
| min | 0.11ms |
| max | 0.32ms |
| total | 4.63ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.11ms | 0.12ms | -0.02ms | -12.37% |
| p50 | 0.14ms | 0.15ms | -0.01ms | -9.25% |
| p95 | 0.21ms | 0.33ms | -0.12ms | -36.68% |
| p99 | 0.29ms | 0.46ms | -0.17ms | -36.58% |
| mean | 0.15ms | 0.18ms | -0.02ms | -13.84% |
| min | 0.11ms | 0.11ms | -0.0081ms | -7.07% |
| max | 0.32ms | 0.51ms | -0.18ms | -36.44% |
| total | 4.63ms | 5.38ms | -0.74ms | -13.84% |

### pool_lifecycle (create + 10 borrow/release + stopAll)

# Perf Report — pool_lifecycle (create + 10 borrow/release + stopAll).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0036ms |
| p50 | 0.0042ms |
| p95 | 0.01ms |
| p99 | 0.10ms |
| mean | 0.0092ms |
| stdev | 0.02ms |
| min | 0.0035ms |
| max | 0.13ms |
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0036ms | 0.0045ms | -0.00090ms | -20.16% |
| p50 | 0.0042ms | 0.0052ms | -0.0010ms | -19.67% |
| p95 | 0.01ms | 0.0089ms | +0.0027ms | +29.88% |
| p99 | 0.10ms | 0.01ms | +0.09ms | +851.78% |
| mean | 0.0092ms | 0.0058ms | +0.0034ms | +58.94% |
| min | 0.0035ms | 0.0043ms | -0.00079ms | -18.26% |
| max | 0.13ms | 0.01ms | +0.12ms | +1171.75% |
| total | 0.27ms | 0.17ms | +0.10ms | +58.94% |

### spec_pool_integration (parseSpec + pool per case)

# Perf Report — spec_pool_integration (parseSpec + pool per case).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0052ms |
| p50 | 0.0056ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0069ms |
| stdev | 0.0029ms |
| min | 0.0052ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0052ms | 0.0047ms | +0.00043ms | +8.97% |
| p50 | 0.0056ms | 0.0049ms | +0.00069ms | +14.01% |
| p95 | 0.01ms | 0.0074ms | +0.0052ms | +69.51% |
| p99 | 0.02ms | 0.01ms | +0.0031ms | +24.72% |
| mean | 0.0069ms | 0.0054ms | +0.0015ms | +27.20% |
| min | 0.0052ms | 0.0046ms | +0.00058ms | +12.74% |
| max | 0.02ms | 0.01ms | +0.0027ms | +19.17% |
| total | 0.21ms | 0.16ms | +0.04ms | +27.20% |

