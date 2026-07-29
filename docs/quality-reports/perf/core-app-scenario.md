# Perf Suite — core-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | 0.11ms | 0.23ms | 50ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 0.0037ms | 0.01ms | 50ms | 0.00042ms | PASS | stable (p10 -17% (閾値未満)、 p95 +23% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| spec_pool_integration (parseSpec + pool per case) | 0.0056ms | 0.01ms | 50ms | 0.00042ms | PASS | stable (p10 +18% (閾値未満)、 p95 +58% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | 0.55ms | 100ms | PASS |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 0.03ms | 100ms | PASS |
| spec_pool_integration (parseSpec + pool per case) | 0.04ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | -2168 B | 0 B | 102400 B | yes | PASS |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 11256 B | 0 B | 102400 B | yes | PASS |
| spec_pool_integration (parseSpec + pool per case) | 824 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### spec_parsing (50 parseSpec of typical spec)

# Perf Report — spec_parsing (50 parseSpec of typical spec).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.11ms |
| p50 | 0.14ms |
| p95 | 0.23ms |
| p99 | 0.32ms |
| mean | 0.16ms |
| stdev | 0.05ms |
| min | 0.11ms |
| max | 0.35ms |
| total | 4.72ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.11ms | 0.12ms | -0.01ms | -10.33% |
| p50 | 0.14ms | 0.15ms | -0.02ms | -11.78% |
| p95 | 0.23ms | 0.33ms | -0.10ms | -31.04% |
| p99 | 0.32ms | 0.46ms | -0.14ms | -29.96% |
| mean | 0.16ms | 0.18ms | -0.02ms | -12.23% |
| min | 0.11ms | 0.11ms | -0.0086ms | -7.50% |
| max | 0.35ms | 0.51ms | -0.15ms | -30.11% |
| total | 4.72ms | 5.38ms | -0.66ms | -12.23% |

### pool_lifecycle (create + 10 borrow/release + stopAll)

# Perf Report — pool_lifecycle (create + 10 borrow/release + stopAll).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0037ms |
| p50 | 0.0040ms |
| p95 | 0.01ms |
| p99 | 0.09ms |
| mean | 0.0087ms |
| stdev | 0.02ms |
| min | 0.0037ms |
| max | 0.12ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0037ms | 0.0045ms | -0.00078ms | -17.35% |
| p50 | 0.0040ms | 0.0052ms | -0.0012ms | -22.90% |
| p95 | 0.01ms | 0.0089ms | +0.0021ms | +23.24% |
| p99 | 0.09ms | 0.01ms | +0.08ms | +744.33% |
| mean | 0.0087ms | 0.0058ms | +0.0030ms | +51.70% |
| min | 0.0037ms | 0.0043ms | -0.00067ms | -15.37% |
| max | 0.12ms | 0.01ms | +0.11ms | +1027.52% |
| total | 0.26ms | 0.17ms | +0.09ms | +51.70% |

### spec_pool_integration (parseSpec + pool per case)

# Perf Report — spec_pool_integration (parseSpec + pool per case).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0056ms |
| p50 | 0.0059ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0070ms |
| stdev | 0.0023ms |
| min | 0.0054ms |
| max | 0.01ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0056ms | 0.0047ms | +0.00083ms | +17.57% |
| p50 | 0.0059ms | 0.0049ms | +0.0010ms | +20.77% |
| p95 | 0.01ms | 0.0074ms | +0.0043ms | +57.93% |
| p99 | 0.01ms | 0.01ms | +0.00067ms | +5.40% |
| mean | 0.0070ms | 0.0054ms | +0.0016ms | +30.07% |
| min | 0.0054ms | 0.0046ms | +0.00083ms | +18.20% |
| max | 0.01ms | 0.01ms | -0.00033ms | -2.39% |
| total | 0.21ms | 0.16ms | +0.05ms | +30.07% |

