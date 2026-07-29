# Perf Suite — core-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00020ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00041ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | 0.12ms | 0.22ms | 50ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 0.0047ms | 0.02ms | 50ms | 0.00041ms | PASS | stable (p10 +5% (閾値未満)、 p95 +146% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| spec_pool_integration (parseSpec + pool per case) | 0.0054ms | 0.0076ms | 50ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | 0.60ms | 100ms | PASS |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 0.07ms | 100ms | PASS |
| spec_pool_integration (parseSpec + pool per case) | 0.04ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | -3144 B | 0 B | 102400 B | yes | PASS |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 5488 B | 0 B | 102400 B | yes | PASS |
| spec_pool_integration (parseSpec + pool per case) | 464 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### spec_parsing (50 parseSpec of typical spec)

# Perf Report — spec_parsing (50 parseSpec of typical spec).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.12ms |
| p50 | 0.14ms |
| p95 | 0.22ms |
| p99 | 0.34ms |
| mean | 0.16ms |
| stdev | 0.05ms |
| min | 0.11ms |
| max | 0.39ms |
| total | 4.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.12ms | 0.12ms | -0.0032ms | -2.59% |
| p50 | 0.14ms | 0.15ms | -0.02ms | -9.96% |
| p95 | 0.22ms | 0.33ms | -0.11ms | -34.28% |
| p99 | 0.34ms | 0.46ms | -0.11ms | -25.10% |
| mean | 0.16ms | 0.18ms | -0.02ms | -13.41% |
| min | 0.11ms | 0.11ms | -0.0088ms | -7.65% |
| max | 0.39ms | 0.51ms | -0.11ms | -22.32% |
| total | 4.66ms | 5.38ms | -0.72ms | -13.41% |

### pool_lifecycle (create + 10 borrow/release + stopAll)

# Perf Report — pool_lifecycle (create + 10 borrow/release + stopAll).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0047ms |
| p50 | 0.0091ms |
| p95 | 0.02ms |
| p99 | 0.19ms |
| mean | 0.02ms |
| stdev | 0.05ms |
| min | 0.0047ms |
| max | 0.26ms |
| total | 0.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0047ms | 0.0045ms | +0.00022ms | +4.82% |
| p50 | 0.0091ms | 0.0052ms | +0.0039ms | +75.50% |
| p95 | 0.02ms | 0.0089ms | +0.01ms | +146.01% |
| p99 | 0.19ms | 0.01ms | +0.18ms | +1725.46% |
| mean | 0.02ms | 0.0058ms | +0.01ms | +201.73% |
| min | 0.0047ms | 0.0043ms | +0.00033ms | +7.71% |
| max | 0.26ms | 0.01ms | +0.25ms | +2350.28% |
| total | 0.52ms | 0.17ms | +0.35ms | +201.73% |

### spec_pool_integration (parseSpec + pool per case)

# Perf Report — spec_pool_integration (parseSpec + pool per case).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0054ms |
| p50 | 0.0055ms |
| p95 | 0.0076ms |
| p99 | 0.01ms |
| mean | 0.0060ms |
| stdev | 0.0015ms |
| min | 0.0053ms |
| max | 0.01ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0054ms | 0.0047ms | +0.00063ms | +13.36% |
| p50 | 0.0055ms | 0.0049ms | +0.00058ms | +11.88% |
| p95 | 0.0076ms | 0.0074ms | +0.00021ms | +2.78% |
| p99 | 0.01ms | 0.01ms | -0.00044ms | -3.57% |
| mean | 0.0060ms | 0.0054ms | +0.00055ms | +10.21% |
| min | 0.0053ms | 0.0046ms | +0.00075ms | +16.36% |
| max | 0.01ms | 0.01ms | -0.00062ms | -4.48% |
| total | 0.18ms | 0.16ms | +0.02ms | +10.21% |

