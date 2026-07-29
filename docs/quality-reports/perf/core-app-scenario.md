# Perf Suite — core-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | 0.11ms | 0.25ms | 50ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 0.0036ms | 0.0095ms | 50ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| spec_pool_integration (parseSpec + pool per case) | 0.0053ms | 0.01ms | 50ms | 0.00049ms | PASS | stable (p10 +12% (閾値未満)、 p95 +65% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | 0.64ms | 100ms | PASS |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 0.03ms | 100ms | PASS |
| spec_pool_integration (parseSpec + pool per case) | 0.02ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | -184 B | 0 B | 102400 B | yes | PASS |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 25840 B | 0 B | 102400 B | yes | PASS |
| spec_pool_integration (parseSpec + pool per case) | -24 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### spec_parsing (50 parseSpec of typical spec)

# Perf Report — spec_parsing (50 parseSpec of typical spec).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.11ms |
| p50 | 0.14ms |
| p95 | 0.25ms |
| p99 | 0.49ms |
| mean | 0.17ms |
| stdev | 0.09ms |
| min | 0.11ms |
| max | 0.59ms |
| total | 5.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.11ms | 0.12ms | -0.01ms | -11.43% |
| p50 | 0.14ms | 0.15ms | -0.01ms | -9.11% |
| p95 | 0.25ms | 0.33ms | -0.08ms | -25.67% |
| p99 | 0.49ms | 0.46ms | +0.03ms | +7.37% |
| mean | 0.17ms | 0.18ms | -0.01ms | -6.45% |
| min | 0.11ms | 0.11ms | -0.0061ms | -5.33% |
| max | 0.59ms | 0.51ms | +0.08ms | +15.30% |
| total | 5.03ms | 5.38ms | -0.35ms | -6.45% |

### pool_lifecycle (create + 10 borrow/release + stopAll)

# Perf Report — pool_lifecycle (create + 10 borrow/release + stopAll).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0036ms |
| p50 | 0.0037ms |
| p95 | 0.0095ms |
| p99 | 0.12ms |
| mean | 0.0097ms |
| stdev | 0.03ms |
| min | 0.0036ms |
| max | 0.16ms |
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0036ms | 0.0045ms | -0.00087ms | -19.31% |
| p50 | 0.0037ms | 0.0052ms | -0.0014ms | -27.71% |
| p95 | 0.0095ms | 0.0089ms | +0.00054ms | +6.01% |
| p99 | 0.12ms | 0.01ms | +0.11ms | +1023.40% |
| mean | 0.0097ms | 0.0058ms | +0.0040ms | +69.12% |
| min | 0.0036ms | 0.0043ms | -0.00075ms | -17.31% |
| max | 0.16ms | 0.01ms | +0.15ms | +1426.75% |
| total | 0.29ms | 0.17ms | +0.12ms | +69.12% |

### spec_pool_integration (parseSpec + pool per case)

# Perf Report — spec_pool_integration (parseSpec + pool per case).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0053ms |
| p50 | 0.0055ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0065ms |
| stdev | 0.0026ms |
| min | 0.0053ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0053ms | 0.0047ms | +0.00059ms | +12.47% |
| p50 | 0.0055ms | 0.0049ms | +0.00056ms | +11.46% |
| p95 | 0.01ms | 0.0074ms | +0.0048ms | +64.50% |
| p99 | 0.02ms | 0.01ms | +0.0034ms | +27.11% |
| mean | 0.0065ms | 0.0054ms | +0.0011ms | +19.51% |
| min | 0.0053ms | 0.0046ms | +0.00071ms | +15.45% |
| max | 0.02ms | 0.01ms | +0.0030ms | +21.57% |
| total | 0.19ms | 0.16ms | +0.03ms | +19.51% |

