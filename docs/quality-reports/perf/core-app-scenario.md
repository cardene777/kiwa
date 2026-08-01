# Perf Suite — core-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00050ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0010ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | 0.13ms | 0.53ms | 50ms | 0.00089ms | PASS | stable (換算後 p10 +8% (閾値未満)、 p95 +155% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 0.0042ms | 0.06ms | 50ms | 0.00088ms | PASS | stable (換算後 p10 +3% (閾値未満)、 p95 +564% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| spec_pool_integration (parseSpec + pool per case) | 0.0063ms | 0.04ms | 50ms | 0.00086ms | PASS | stable (換算後 p10 +4% (閾値未満)、 p95 +101% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | cpu | 0.09ms | 0.12ms | 0.13ms | 1.440 | 1.335 | n/a | 20.0% | 0.12ms | 0.11ms |
| pool_lifecycle (create + 10 borrow/release + stopAll) | cpu | 0.09ms | 0.14ms | 0.0042ms | 0.045 | 0.043 | n/a | 20.0% | 0.0037ms | 0.0035ms |
| spec_pool_integration (parseSpec + pool per case) | cpu | 0.09ms | 0.13ms | 0.0063ms | 0.067 | 0.065 | n/a | 20.0% | 0.0054ms | 0.0052ms |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | 1.23ms | 100ms | PASS |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 0.09ms | 100ms | PASS |
| spec_pool_integration (parseSpec + pool per case) | 0.10ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | -12440 B | -1165 B | 102400 B | yes | 33 (3 + 30) | PASS |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 6344 B | 0 B | 102400 B | yes | 33 (3 + 30) | PASS |
| spec_pool_integration (parseSpec + pool per case) | 1944 B | 0 B | 102400 B | yes | 33 (3 + 30) | PASS |

## Detailed serial reports

### spec_parsing (50 parseSpec of typical spec)

# Perf Report — spec_parsing (50 parseSpec of typical spec).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.13ms |
| p50 | 0.14ms |
| p95 | 0.53ms |
| p99 | 0.60ms |
| mean | 0.22ms |
| stdev | 0.14ms |
| min | 0.12ms |
| max | 0.61ms |
| total | 6.55ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.893)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.12ms | 0.11ms | +0.0084ms | +7.83% |
| p50 | 0.13ms | 0.13ms | -0.00016ms | -0.12% |
| p95 | 0.47ms | 0.18ms | +0.29ms | +155.31% |
| p99 | 0.54ms | 0.28ms | +0.25ms | +89.46% |
| mean | 0.19ms | 0.14ms | +0.06ms | +39.83% |
| min | 0.11ms | 0.11ms | +0.00082ms | +0.78% |
| max | 0.54ms | 0.32ms | +0.23ms | +71.26% |
| total | 5.85ms | 4.18ms | +1.67ms | +39.83% |

### pool_lifecycle (create + 10 borrow/release + stopAll)

# Perf Report — pool_lifecycle (create + 10 borrow/release + stopAll).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0042ms |
| p50 | 0.0064ms |
| p95 | 0.06ms |
| p99 | 0.15ms |
| mean | 0.02ms |
| stdev | 0.04ms |
| min | 0.0041ms |
| max | 0.19ms |
| total | 0.53ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.878)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0037ms | 0.0035ms | +0.00011ms | +3.20% |
| p50 | 0.0057ms | 0.0038ms | +0.0019ms | +49.93% |
| p95 | 0.05ms | 0.0076ms | +0.04ms | +564.31% |
| p99 | 0.14ms | 0.01ms | +0.12ms | +974.00% |
| mean | 0.02ms | 0.0047ms | +0.01ms | +229.35% |
| min | 0.0036ms | 0.0035ms | +0.000082ms | +2.32% |
| max | 0.17ms | 0.01ms | +0.15ms | +1078.22% |
| total | 0.46ms | 0.14ms | +0.32ms | +229.35% |

### spec_pool_integration (parseSpec + pool per case)

# Perf Report — spec_pool_integration (parseSpec + pool per case).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0063ms |
| p50 | 0.01ms |
| p95 | 0.04ms |
| p99 | 0.09ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.0061ms |
| max | 0.10ms |
| total | 0.53ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.863)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0054ms | 0.0052ms | +0.00022ms | +4.13% |
| p50 | 0.0092ms | 0.0057ms | +0.0035ms | +60.87% |
| p95 | 0.04ms | 0.02ms | +0.02ms | +101.41% |
| p99 | 0.07ms | 0.03ms | +0.04ms | +132.13% |
| mean | 0.02ms | 0.0081ms | +0.0072ms | +88.91% |
| min | 0.0053ms | 0.0051ms | +0.00020ms | +3.94% |
| max | 0.09ms | 0.04ms | +0.05ms | +146.62% |
| total | 0.46ms | 0.24ms | +0.22ms | +88.91% |

