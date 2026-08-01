# Perf Suite — orm-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| bulk_insert (setup + 100 insert) | 0.42ms | 0.84ms | 200ms | 0.00050ms | PASS | stable (換算後 p10 +11% (閾値未満)、 p95 +36% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| query_workload (100 insert + 100 select) | 0.44ms | 0.85ms | 200ms | 0.00049ms | PASS | stable (換算後 p10 +18% (閾値未満)、 p95 +90% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| crud_cycle (10 rows × insert+update+delete) | 0.30ms | 0.72ms | 200ms | 0.00049ms | PASS | stable (換算後 p10 +7% (閾値未満)、 p95 +83% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| bulk_insert (setup + 100 insert) | cpu | 0.08ms | 0.10ms | 0.42ms | 5.106 | 4.606 | n/a | 20.0% | 0.42ms | 0.38ms |
| query_workload (100 insert + 100 select) | cpu | 0.08ms | 0.10ms | 0.44ms | 5.308 | 4.482 | n/a | 20.0% | 0.43ms | 0.36ms |
| crud_cycle (10 rows × insert+update+delete) | cpu | 0.08ms | 0.10ms | 0.30ms | 3.615 | 3.388 | n/a | 20.0% | 0.29ms | 0.27ms |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| bulk_insert (setup + 100 insert) | 1.27ms | 400ms | PASS |
| query_workload (100 insert + 100 select) | 1.14ms | 400ms | PASS |
| crud_cycle (10 rows × insert+update+delete) | 0.78ms | 400ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| bulk_insert (setup + 100 insert) | -57808 B | -3 B | 102400 B | yes | 18 (3 + 15) | PASS |
| query_workload (100 insert + 100 select) | -7952 B | 1 B | 102400 B | yes | 18 (3 + 15) | PASS |
| crud_cycle (10 rows × insert+update+delete) | -35328 B | -1 B | 102400 B | yes | 18 (3 + 15) | PASS |

## Detailed serial reports

### bulk_insert (setup + 100 insert)

# Perf Report — bulk_insert (setup + 100 insert).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.42ms |
| p50 | 0.56ms |
| p95 | 0.84ms |
| p99 | 0.92ms |
| mean | 0.58ms |
| stdev | 0.15ms |
| min | 0.40ms |
| max | 0.95ms |
| total | 8.74ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.994)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.42ms | 0.38ms | +0.04ms | +10.86% |
| p50 | 0.56ms | 0.45ms | +0.11ms | +24.62% |
| p95 | 0.83ms | 0.61ms | +0.22ms | +36.32% |
| p99 | 0.92ms | 0.62ms | +0.30ms | +49.17% |
| mean | 0.58ms | 0.48ms | +0.10ms | +21.27% |
| min | 0.39ms | 0.35ms | +0.04ms | +11.03% |
| max | 0.94ms | 0.62ms | +0.32ms | +52.35% |
| total | 8.69ms | 7.16ms | +1.52ms | +21.27% |

### query_workload (100 insert + 100 select)

# Perf Report — query_workload (100 insert + 100 select).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.44ms |
| p50 | 0.52ms |
| p95 | 0.85ms |
| p99 | 0.88ms |
| mean | 0.56ms |
| stdev | 0.14ms |
| min | 0.41ms |
| max | 0.89ms |
| total | 8.45ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.987)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.43ms | 0.36ms | +0.07ms | +18.44% |
| p50 | 0.51ms | 0.38ms | +0.14ms | +36.01% |
| p95 | 0.84ms | 0.44ms | +0.40ms | +89.77% |
| p99 | 0.87ms | 0.46ms | +0.41ms | +90.40% |
| mean | 0.56ms | 0.39ms | +0.17ms | +42.75% |
| min | 0.41ms | 0.33ms | +0.08ms | +22.93% |
| max | 0.88ms | 0.46ms | +0.42ms | +90.55% |
| total | 8.34ms | 5.84ms | +2.50ms | +42.75% |

### crud_cycle (10 rows × insert+update+delete)

# Perf Report — crud_cycle (10 rows × insert+update+delete).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.30ms |
| p50 | 0.49ms |
| p95 | 0.72ms |
| p99 | 0.83ms |
| mean | 0.48ms |
| stdev | 0.16ms |
| min | 0.25ms |
| max | 0.86ms |
| total | 7.18ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.978)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.29ms | 0.27ms | +0.02ms | +6.70% |
| p50 | 0.48ms | 0.31ms | +0.16ms | +51.64% |
| p95 | 0.70ms | 0.38ms | +0.32ms | +82.84% |
| p99 | 0.81ms | 0.40ms | +0.41ms | +102.71% |
| mean | 0.47ms | 0.32ms | +0.15ms | +46.54% |
| min | 0.25ms | 0.26ms | -0.01ms | -5.69% |
| max | 0.84ms | 0.41ms | +0.44ms | +107.40% |
| total | 7.02ms | 4.79ms | +2.23ms | +46.54% |

