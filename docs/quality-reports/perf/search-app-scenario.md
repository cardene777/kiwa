# Perf Suite — search-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00058ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | 0.30ms | 0.98ms | 100ms | 0.0012ms | PASS | stable (p10 +13% (閾値未満)、 p95 +39% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| search_heavy_workload (50 docs + 50 search) | 0.63ms | 1.02ms | 100ms | 0.0012ms | PASS | stable — gate 無効 (regressionGate=false) |
| filter_search_cycle (20 docs + 20 filtered search) | 0.09ms | 0.17ms | 80ms | 0.0012ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | cpu | 0.08ms | 0.30ms | 3.574 | 3.159 | 0.30ms | 0.27ms |
| search_heavy_workload (50 docs + 50 search) | cpu | 0.08ms | 0.63ms | 7.858 | 8.423 | 0.65ms | 0.69ms |
| filter_search_cycle (20 docs + 20 filtered search) | cpu | 0.08ms | 0.09ms | 1.073 | 1.122 | 0.09ms | 0.09ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | 2.50ms | 200ms | PASS |
| search_heavy_workload (50 docs + 50 search) | 2.70ms | 200ms | PASS |
| filter_search_cycle (20 docs + 20 filtered search) | 0.41ms | 160ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | -11800 B | 0 B | 102400 B | yes | PASS |
| search_heavy_workload (50 docs + 50 search) | -4064 B | 0 B | 102400 B | yes | PASS |
| filter_search_cycle (20 docs + 20 filtered search) | -12920 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### index_build (100 docs addDocuments + 10 search)

# Perf Report — index_build (100 docs addDocuments + 10 search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.30ms |
| p50 | 0.61ms |
| p95 | 0.98ms |
| p99 | 1.17ms |
| mean | 0.63ms |
| stdev | 0.27ms |
| min | 0.26ms |
| max | 1.22ms |
| total | 12.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.30ms | 0.27ms | +0.03ms | +11.60% |
| p50 | 0.61ms | 0.36ms | +0.25ms | +68.84% |
| p95 | 0.98ms | 0.71ms | +0.26ms | +37.08% |
| p99 | 1.17ms | 0.97ms | +0.20ms | +20.60% |
| mean | 0.63ms | 0.41ms | +0.22ms | +54.09% |
| min | 0.26ms | 0.26ms | +0.0016ms | +0.61% |
| max | 1.22ms | 1.04ms | +0.18ms | +17.76% |
| total | 12.51ms | 8.12ms | +4.39ms | +54.09% |

### search_heavy_workload (50 docs + 50 search)

# Perf Report — search_heavy_workload (50 docs + 50 search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.63ms |
| p50 | 0.77ms |
| p95 | 1.02ms |
| p99 | 1.71ms |
| mean | 0.80ms |
| stdev | 0.27ms |
| min | 0.61ms |
| max | 1.88ms |
| total | 15.92ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.63ms | 0.69ms | -0.06ms | -9.16% |
| p50 | 0.77ms | 0.85ms | -0.09ms | -10.25% |
| p95 | 1.02ms | 1.06ms | -0.03ms | -3.20% |
| p99 | 1.71ms | 1.12ms | +0.59ms | +52.86% |
| mean | 0.80ms | 0.86ms | -0.07ms | -7.78% |
| min | 0.61ms | 0.64ms | -0.03ms | -4.79% |
| max | 1.88ms | 1.13ms | +0.75ms | +65.90% |
| total | 15.92ms | 17.26ms | -1.34ms | -7.78% |

### filter_search_cycle (20 docs + 20 filtered search)

# Perf Report — filter_search_cycle (20 docs + 20 filtered search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.09ms |
| p50 | 0.10ms |
| p95 | 0.17ms |
| p99 | 0.23ms |
| mean | 0.11ms |
| stdev | 0.04ms |
| min | 0.09ms |
| max | 0.25ms |
| total | 2.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.09ms | 0.09ms | -0.0054ms | -5.86% |
| p50 | 0.10ms | 0.11ms | -0.0087ms | -8.25% |
| p95 | 0.17ms | 0.22ms | -0.05ms | -21.61% |
| p99 | 0.23ms | 0.23ms | +0.0031ms | +1.37% |
| mean | 0.11ms | 0.12ms | -0.02ms | -14.25% |
| min | 0.09ms | 0.09ms | -0.0054ms | -5.86% |
| max | 0.25ms | 0.23ms | +0.02ms | +6.82% |
| total | 2.14ms | 2.49ms | -0.36ms | -14.25% |

