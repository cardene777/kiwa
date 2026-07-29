# Perf Suite — core-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | 0.11ms | 0.21ms | 50ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 0.0039ms | 0.01ms | 50ms | 0.00042ms | PASS | stable (p10 -13% (閾値未満)、 p95 +21% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| spec_pool_integration (parseSpec + pool per case) | 0.0059ms | 0.01ms | 50ms | 0.00042ms | PASS | regressed — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | 0.83ms | 100ms | PASS |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 0.03ms | 100ms | PASS |
| spec_pool_integration (parseSpec + pool per case) | 0.03ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | -1512 B | 0 B | 102400 B | yes | PASS |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 246152 B | 0 B | 102400 B | yes | PASS |
| spec_pool_integration (parseSpec + pool per case) | 1816 B | 0 B | 102400 B | yes | PASS |

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
| p99 | 0.33ms |
| mean | 0.16ms |
| stdev | 0.05ms |
| min | 0.11ms |
| max | 0.37ms |
| total | 4.71ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.11ms | 0.12ms | -0.01ms | -8.31% |
| p50 | 0.14ms | 0.15ms | -0.01ms | -9.03% |
| p95 | 0.21ms | 0.33ms | -0.12ms | -35.94% |
| p99 | 0.33ms | 0.46ms | -0.13ms | -28.68% |
| mean | 0.16ms | 0.18ms | -0.02ms | -12.44% |
| min | 0.11ms | 0.11ms | -0.0037ms | -3.23% |
| max | 0.37ms | 0.51ms | -0.14ms | -27.12% |
| total | 4.71ms | 5.38ms | -0.67ms | -12.44% |

### pool_lifecycle (create + 10 borrow/release + stopAll)

# Perf Report — pool_lifecycle (create + 10 borrow/release + stopAll).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0039ms |
| p50 | 0.0041ms |
| p95 | 0.01ms |
| p99 | 0.10ms |
| mean | 0.0090ms |
| stdev | 0.02ms |
| min | 0.0039ms |
| max | 0.13ms |
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0039ms | 0.0045ms | -0.00057ms | -12.72% |
| p50 | 0.0041ms | 0.0052ms | -0.0011ms | -20.88% |
| p95 | 0.01ms | 0.0089ms | +0.0019ms | +21.00% |
| p99 | 0.10ms | 0.01ms | +0.09ms | +825.08% |
| mean | 0.0090ms | 0.0058ms | +0.0032ms | +55.92% |
| min | 0.0039ms | 0.0043ms | -0.00046ms | -10.57% |
| max | 0.13ms | 0.01ms | +0.12ms | +1134.70% |
| total | 0.27ms | 0.17ms | +0.10ms | +55.92% |

### spec_pool_integration (parseSpec + pool per case)

# Perf Report — spec_pool_integration (parseSpec + pool per case).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0059ms |
| p50 | 0.0062ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0075ms |
| stdev | 0.0028ms |
| min | 0.0057ms |
| max | 0.01ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0059ms | 0.0047ms | +0.0011ms | +23.73% |
| p50 | 0.0062ms | 0.0049ms | +0.0013ms | +26.70% |
| p95 | 0.01ms | 0.0074ms | +0.0067ms | +89.97% |
| p99 | 0.01ms | 0.01ms | +0.0024ms | +19.40% |
| mean | 0.0075ms | 0.0054ms | +0.0021ms | +38.76% |
| min | 0.0057ms | 0.0046ms | +0.0012ms | +25.46% |
| max | 0.01ms | 0.01ms | +0.0010ms | +7.49% |
| total | 0.22ms | 0.16ms | +0.06ms | +38.76% |

