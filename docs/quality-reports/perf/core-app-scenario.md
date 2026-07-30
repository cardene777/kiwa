# Perf Suite — core-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00020ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00041ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | 0.11ms | 0.18ms | 50ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 0.0035ms | 0.02ms | 50ms | 0.00042ms | PASS | stable (換算後 p10 +2% (閾値未満)、 p95 +155% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| spec_pool_integration (parseSpec + pool per case) | 0.0051ms | 0.0093ms | 50ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | cpu | 0.08ms | 0.09ms | 0.11ms | 1.315 | 1.335 | 0.11ms | 0.11ms |
| pool_lifecycle (create + 10 borrow/release + stopAll) | cpu | 0.08ms | 0.09ms | 0.0035ms | 0.044 | 0.043 | 0.0036ms | 0.0035ms |
| spec_pool_integration (parseSpec + pool per case) | cpu | 0.08ms | 0.08ms | 0.0051ms | 0.064 | 0.065 | 0.0052ms | 0.0052ms |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | 0.63ms | 100ms | PASS |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 0.03ms | 100ms | PASS |
| spec_pool_integration (parseSpec + pool per case) | 0.03ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | -6448 B | 0 B | 102400 B | yes | PASS |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 269504 B | 0 B | 102400 B | yes | PASS |
| spec_pool_integration (parseSpec + pool per case) | 312 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### spec_parsing (50 parseSpec of typical spec)

# Perf Report — spec_parsing (50 parseSpec of typical spec).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.11ms |
| p50 | 0.13ms |
| p95 | 0.18ms |
| p99 | 0.23ms |
| mean | 0.13ms |
| stdev | 0.03ms |
| min | 0.10ms |
| max | 0.24ms |
| total | 4.02ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.998)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.11ms | 0.11ms | -0.0016ms | -1.50% |
| p50 | 0.13ms | 0.13ms | -0.0037ms | -2.87% |
| p95 | 0.18ms | 0.18ms | -0.0016ms | -0.89% |
| p99 | 0.23ms | 0.28ms | -0.06ms | -19.76% |
| mean | 0.13ms | 0.14ms | -0.0056ms | -3.99% |
| min | 0.10ms | 0.11ms | -0.0017ms | -1.57% |
| max | 0.24ms | 0.32ms | -0.07ms | -22.64% |
| total | 4.02ms | 4.18ms | -0.17ms | -3.99% |

### pool_lifecycle (create + 10 borrow/release + stopAll)

# Perf Report — pool_lifecycle (create + 10 borrow/release + stopAll).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0035ms |
| p50 | 0.0038ms |
| p95 | 0.02ms |
| p99 | 0.08ms |
| mean | 0.0086ms |
| stdev | 0.02ms |
| min | 0.0035ms |
| max | 0.11ms |
| total | 0.26ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.020)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0036ms | 0.0035ms | +0.000067ms | +1.90% |
| p50 | 0.0038ms | 0.0038ms | +0.000077ms | +2.04% |
| p95 | 0.02ms | 0.0076ms | +0.01ms | +154.97% |
| p99 | 0.09ms | 0.01ms | +0.07ms | +579.35% |
| mean | 0.0088ms | 0.0047ms | +0.0041ms | +87.27% |
| min | 0.0035ms | 0.0035ms | -0.000012ms | -0.34% |
| max | 0.11ms | 0.01ms | +0.09ms | +673.84% |
| total | 0.26ms | 0.14ms | +0.12ms | +87.27% |

### spec_pool_integration (parseSpec + pool per case)

# Perf Report — spec_pool_integration (parseSpec + pool per case).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0051ms |
| p50 | 0.0054ms |
| p95 | 0.0093ms |
| p99 | 0.01ms |
| mean | 0.0060ms |
| stdev | 0.0017ms |
| min | 0.0050ms |
| max | 0.01ms |
| total | 0.18ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.007)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0052ms | 0.0052ms | -0.000053ms | -1.01% |
| p50 | 0.0054ms | 0.0057ms | -0.00032ms | -5.57% |
| p95 | 0.0093ms | 0.02ms | -0.0095ms | -50.51% |
| p99 | 0.01ms | 0.03ms | -0.02ms | -62.30% |
| mean | 0.0060ms | 0.0081ms | -0.0021ms | -25.67% |
| min | 0.0051ms | 0.0051ms | -0.0000081ms | -0.16% |
| max | 0.01ms | 0.04ms | -0.02ms | -65.15% |
| total | 0.18ms | 0.24ms | -0.06ms | -25.67% |

