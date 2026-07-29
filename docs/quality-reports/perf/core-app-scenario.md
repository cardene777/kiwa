# Perf Suite — core-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | 0.12ms | 0.23ms | 50ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 0.0048ms | 0.0093ms | 50ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| spec_pool_integration (parseSpec + pool per case) | 0.0057ms | 0.0099ms | 50ms | 0.00050ms | PASS | stable (p10 +19% (閾値未満)、 p95 +33% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | 0.68ms | 100ms | PASS |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 0.03ms | 100ms | PASS |
| spec_pool_integration (parseSpec + pool per case) | 0.02ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | -1240 B | 0 B | 102400 B | yes | PASS |
| pool_lifecycle (create + 10 borrow/release + stopAll) | -42648 B | 0 B | 102400 B | yes | PASS |
| spec_pool_integration (parseSpec + pool per case) | -5128 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### spec_parsing (50 parseSpec of typical spec)

# Perf Report — spec_parsing (50 parseSpec of typical spec).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.12ms |
| p50 | 0.15ms |
| p95 | 0.23ms |
| p99 | 0.45ms |
| mean | 0.17ms |
| stdev | 0.08ms |
| min | 0.12ms |
| max | 0.53ms |
| total | 5.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.12ms | 0.12ms | -0.0037ms | -2.94% |
| p50 | 0.15ms | 0.15ms | -0.0045ms | -2.95% |
| p95 | 0.23ms | 0.33ms | -0.10ms | -29.54% |
| p99 | 0.45ms | 0.46ms | -0.01ms | -2.66% |
| mean | 0.17ms | 0.18ms | -0.0046ms | -2.59% |
| min | 0.12ms | 0.11ms | +0.0055ms | +4.75% |
| max | 0.53ms | 0.51ms | +0.02ms | +4.80% |
| total | 5.24ms | 5.38ms | -0.14ms | -2.59% |

### pool_lifecycle (create + 10 borrow/release + stopAll)

# Perf Report — pool_lifecycle (create + 10 borrow/release + stopAll).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0048ms |
| p50 | 0.0051ms |
| p95 | 0.0093ms |
| p99 | 0.07ms |
| mean | 0.0085ms |
| stdev | 0.02ms |
| min | 0.0047ms |
| max | 0.10ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0048ms | 0.0045ms | +0.00030ms | +6.69% |
| p50 | 0.0051ms | 0.0052ms | -0.000062ms | -1.20% |
| p95 | 0.0093ms | 0.0089ms | +0.00037ms | +4.13% |
| p99 | 0.07ms | 0.01ms | +0.06ms | +582.06% |
| mean | 0.0085ms | 0.0058ms | +0.0028ms | +48.17% |
| min | 0.0047ms | 0.0043ms | +0.00042ms | +9.62% |
| max | 0.10ms | 0.01ms | +0.08ms | +810.79% |
| total | 0.26ms | 0.17ms | +0.08ms | +48.17% |

### spec_pool_integration (parseSpec + pool per case)

# Perf Report — spec_pool_integration (parseSpec + pool per case).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0057ms |
| p50 | 0.0057ms |
| p95 | 0.0099ms |
| p99 | 0.01ms |
| mean | 0.0064ms |
| stdev | 0.0017ms |
| min | 0.0055ms |
| max | 0.01ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0057ms | 0.0047ms | +0.00092ms | +19.41% |
| p50 | 0.0057ms | 0.0049ms | +0.00081ms | +16.55% |
| p95 | 0.0099ms | 0.0074ms | +0.0025ms | +33.39% |
| p99 | 0.01ms | 0.01ms | +0.00031ms | +2.51% |
| mean | 0.0064ms | 0.0054ms | +0.00095ms | +17.58% |
| min | 0.0055ms | 0.0046ms | +0.00096ms | +20.90% |
| max | 0.01ms | 0.01ms | -0.00058ms | -4.19% |
| total | 0.19ms | 0.16ms | +0.03ms | +17.58% |

