# Perf Suite — core-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | 0.11ms | 0.31ms | 50ms | 0.00051ms | PASS | stable (p10 -6% (閾値未満)、 p95 +36% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 0.0038ms | 0.01ms | 50ms | 0.00045ms | PASS | stable — gate 無効 (regressionGate=false) |
| spec_pool_integration (parseSpec + pool per case) | 0.0051ms | 0.01ms | 50ms | 0.00054ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | cpu | 0.09ms | 0.11ms | 1.263 | 1.345 | 0.11ms | 0.12ms |
| pool_lifecycle (create + 10 borrow/release + stopAll) | cpu | 0.09ms | 0.0038ms | 0.043 | 0.045 | 0.0035ms | 0.0037ms |
| spec_pool_integration (parseSpec + pool per case) | cpu | 0.08ms | 0.0051ms | 0.063 | 0.063 | 0.0057ms | 0.0056ms |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | 0.60ms | 100ms | PASS |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 0.03ms | 100ms | PASS |
| spec_pool_integration (parseSpec + pool per case) | 0.03ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | -6592 B | 0 B | 102400 B | yes | PASS |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 236160 B | 0 B | 102400 B | yes | PASS |
| spec_pool_integration (parseSpec + pool per case) | 3144 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### spec_parsing (50 parseSpec of typical spec)

# Perf Report — spec_parsing (50 parseSpec of typical spec).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.11ms |
| p50 | 0.13ms |
| p95 | 0.31ms |
| p99 | 0.33ms |
| mean | 0.15ms |
| stdev | 0.06ms |
| min | 0.11ms |
| max | 0.33ms |
| total | 4.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.11ms | 0.12ms | -0.01ms | -10.26% |
| p50 | 0.13ms | 0.14ms | -0.0079ms | -5.55% |
| p95 | 0.31ms | 0.24ms | +0.07ms | +29.94% |
| p99 | 0.33ms | 0.36ms | -0.03ms | -9.53% |
| mean | 0.15ms | 0.17ms | -0.01ms | -8.55% |
| min | 0.11ms | 0.12ms | -0.01ms | -9.49% |
| max | 0.33ms | 0.41ms | -0.08ms | -18.72% |
| total | 4.58ms | 5.01ms | -0.43ms | -8.55% |

### pool_lifecycle (create + 10 borrow/release + stopAll)

# Perf Report — pool_lifecycle (create + 10 borrow/release + stopAll).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0038ms |
| p50 | 0.0041ms |
| p95 | 0.01ms |
| p99 | 0.09ms |
| mean | 0.0092ms |
| stdev | 0.02ms |
| min | 0.0035ms |
| max | 0.12ms |
| total | 0.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0038ms | 0.0037ms | +0.00010ms | +2.70% |
| p50 | 0.0041ms | 0.0040ms | +0.000041ms | +1.03% |
| p95 | 0.01ms | 0.02ms | -0.01ms | -51.26% |
| p99 | 0.09ms | 0.03ms | +0.06ms | +201.05% |
| mean | 0.0092ms | 0.0065ms | +0.0027ms | +40.82% |
| min | 0.0035ms | 0.0037ms | -0.00013ms | -3.44% |
| max | 0.12ms | 0.03ms | +0.09ms | +290.94% |
| total | 0.28ms | 0.20ms | +0.08ms | +40.82% |

### spec_pool_integration (parseSpec + pool per case)

# Perf Report — spec_pool_integration (parseSpec + pool per case).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0051ms |
| p50 | 0.0055ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0061ms |
| stdev | 0.0018ms |
| min | 0.0051ms |
| max | 0.01ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0051ms | 0.0056ms | -0.00050ms | -8.96% |
| p50 | 0.0055ms | 0.0057ms | -0.00021ms | -3.62% |
| p95 | 0.01ms | 0.01ms | -0.0013ms | -11.83% |
| p99 | 0.01ms | 0.01ms | -0.0010ms | -7.78% |
| mean | 0.0061ms | 0.0066ms | -0.00051ms | -7.74% |
| min | 0.0051ms | 0.0056ms | -0.00054ms | -9.64% |
| max | 0.01ms | 0.01ms | -0.0014ms | -10.03% |
| total | 0.18ms | 0.20ms | -0.02ms | -7.74% |

