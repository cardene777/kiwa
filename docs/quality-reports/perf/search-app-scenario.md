# Perf Suite — search-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00058ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | 0.29ms | 1.25ms | 100ms | 0.0010ms | PASS | stable (換算後 p10 +3% (閾値未満)、 p95 +100% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| search_heavy_workload (50 docs + 50 search) | 0.75ms | 1.04ms | 100ms | 0.00095ms | PASS | stable — gate 無効 (regressionGate=false) |
| filter_search_cycle (20 docs + 20 filtered search) | 0.23ms | 0.66ms | 80ms | 0.0010ms | PASS | regressed — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | cpu | 0.09ms | 0.18ms | 0.29ms | 3.099 | 3.011 | n/a | 20.0% | 0.25ms | 0.25ms |
| search_heavy_workload (50 docs + 50 search) | cpu | 0.10ms | 0.11ms | 0.75ms | 7.561 | 8.304 | n/a | 20.0% | 0.61ms | 0.67ms |
| filter_search_cycle (20 docs + 20 filtered search) | cpu | 0.09ms | 0.18ms | 0.23ms | 2.455 | 1.064 | n/a | 20.0% | 0.20ms | 0.09ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | 1.33ms | 200ms | PASS |
| search_heavy_workload (50 docs + 50 search) | 7.98ms | 200ms | PASS |
| filter_search_cycle (20 docs + 20 filtered search) | 0.53ms | 160ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | -15840 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| search_heavy_workload (50 docs + 50 search) | -5040 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| filter_search_cycle (20 docs + 20 filtered search) | -7824 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### index_build (100 docs addDocuments + 10 search)

# Perf Report — index_build (100 docs addDocuments + 10 search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.29ms |
| p50 | 0.73ms |
| p95 | 1.25ms |
| p99 | 1.29ms |
| mean | 0.71ms |
| stdev | 0.37ms |
| min | 0.29ms |
| max | 1.30ms |
| total | 14.15ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.880)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.25ms | 0.25ms | +0.0072ms | +2.92% |
| p50 | 0.64ms | 0.30ms | +0.34ms | +115.04% |
| p95 | 1.10ms | 0.55ms | +0.55ms | +99.68% |
| p99 | 1.14ms | 0.67ms | +0.46ms | +68.56% |
| mean | 0.62ms | 0.34ms | +0.29ms | +85.17% |
| min | 0.25ms | 0.25ms | +0.0076ms | +3.06% |
| max | 1.15ms | 0.71ms | +0.44ms | +62.50% |
| total | 12.45ms | 6.72ms | +5.73ms | +85.17% |

### search_heavy_workload (50 docs + 50 search)

# Perf Report — search_heavy_workload (50 docs + 50 search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.75ms |
| p50 | 0.80ms |
| p95 | 1.04ms |
| p99 | 1.26ms |
| mean | 0.87ms |
| stdev | 0.15ms |
| min | 0.75ms |
| max | 1.32ms |
| total | 17.47ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.815)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.61ms | 0.67ms | -0.06ms | -8.95% |
| p50 | 0.66ms | 0.75ms | -0.09ms | -12.24% |
| p95 | 0.85ms | 0.88ms | -0.03ms | -3.84% |
| p99 | 1.03ms | 0.90ms | +0.13ms | +14.68% |
| mean | 0.71ms | 0.75ms | -0.04ms | -4.93% |
| min | 0.61ms | 0.64ms | -0.03ms | -5.21% |
| max | 1.08ms | 0.90ms | +0.17ms | +19.18% |
| total | 14.24ms | 14.97ms | -0.74ms | -4.93% |

### filter_search_cycle (20 docs + 20 filtered search)

# Perf Report — filter_search_cycle (20 docs + 20 filtered search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.23ms |
| p50 | 0.30ms |
| p95 | 0.66ms |
| p99 | 0.67ms |
| mean | 0.36ms |
| stdev | 0.16ms |
| min | 0.23ms |
| max | 0.67ms |
| total | 7.24ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.863)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.20ms | 0.09ms | +0.11ms | +130.75% |
| p50 | 0.26ms | 0.10ms | +0.16ms | +170.12% |
| p95 | 0.57ms | 0.11ms | +0.46ms | +413.23% |
| p99 | 0.58ms | 0.17ms | +0.41ms | +247.26% |
| mean | 0.31ms | 0.10ms | +0.21ms | +215.83% |
| min | 0.20ms | 0.09ms | +0.11ms | +128.52% |
| max | 0.58ms | 0.18ms | +0.40ms | +221.56% |
| total | 6.25ms | 1.98ms | +4.27ms | +215.83% |

