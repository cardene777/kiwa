# Perf Suite — cli-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 2.47ms | 7.28ms | 500ms | 0.00020ms | PASS | improved — gate 無効 (regressionGate=false) |
| spec_to_test_batch (5 consecutive runSpecToTest) | 0.52ms | 1.26ms | 300ms | 0.00026ms | PASS | improved — gate 無効 (regressionGate=false) |
| init_error_handling (3 InitConflictError catch) | 0.80ms | 1.72ms | 500ms | 0.00022ms | PASS | improved — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | fs-write | 0.34ms | 2.15ms | 2.47ms | 7.277 | 13.022 | n/a | 20.0% | 0.98ms | 1.76ms |
| spec_to_test_batch (5 consecutive runSpecToTest) | fs-write | 0.14ms | 0.70ms | 0.52ms | 3.669 | 5.493 | n/a | 20.0% | 0.27ms | 0.41ms |
| init_error_handling (3 InitConflictError catch) | fs-write | 0.25ms | 0.46ms | 0.80ms | 3.212 | 6.201 | n/a | 20.0% | 0.35ms | 0.68ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 12.41ms | 1000ms | PASS |
| spec_to_test_batch (5 consecutive runSpecToTest) | 4.33ms | 600ms | PASS |
| init_error_handling (3 InitConflictError catch) | 3.67ms | 1000ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | -1560 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| spec_to_test_batch (5 consecutive runSpecToTest) | -2144 B | -9200 B | 102400 B | yes | 23 (3 + 20) | PASS |
| init_error_handling (3 InitConflictError catch) | 5400 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### init_workflow (3 fresh project scaffold)

# Perf Report — init_workflow (3 fresh project scaffold).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 2.47ms |
| p50 | 3.01ms |
| p95 | 7.28ms |
| p99 | 8.59ms |
| mean | 3.71ms |
| stdev | 1.75ms |
| min | 2.34ms |
| max | 8.92ms |
| total | 74.22ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.399)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.98ms | 1.76ms | -0.78ms | -44.12% |
| p50 | 1.20ms | 2.03ms | -0.83ms | -40.84% |
| p95 | 2.90ms | 2.64ms | +0.26ms | +9.82% |
| p99 | 3.43ms | 2.74ms | +0.68ms | +24.99% |
| mean | 1.48ms | 2.09ms | -0.61ms | -29.29% |
| min | 0.93ms | 1.54ms | -0.61ms | -39.39% |
| max | 3.56ms | 2.77ms | +0.79ms | +28.61% |
| total | 29.60ms | 41.86ms | -12.26ms | -29.29% |

### spec_to_test_batch (5 consecutive runSpecToTest)

# Perf Report — spec_to_test_batch (5 consecutive runSpecToTest).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.52ms |
| p50 | 0.64ms |
| p95 | 1.26ms |
| p99 | 1.34ms |
| mean | 0.75ms |
| stdev | 0.27ms |
| min | 0.49ms |
| max | 1.35ms |
| total | 14.98ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.527)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.27ms | 0.41ms | -0.14ms | -33.21% |
| p50 | 0.34ms | 0.47ms | -0.13ms | -28.62% |
| p95 | 0.67ms | 0.56ms | +0.10ms | +18.50% |
| p99 | 0.70ms | 0.59ms | +0.12ms | +20.08% |
| mean | 0.40ms | 0.48ms | -0.08ms | -17.16% |
| min | 0.26ms | 0.40ms | -0.14ms | -35.24% |
| max | 0.71ms | 0.59ms | +0.12ms | +20.46% |
| total | 7.90ms | 9.54ms | -1.64ms | -17.16% |

### init_error_handling (3 InitConflictError catch)

# Perf Report — init_error_handling (3 InitConflictError catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.80ms |
| p50 | 1.04ms |
| p95 | 1.72ms |
| p99 | 1.82ms |
| mean | 1.11ms |
| stdev | 0.32ms |
| min | 0.69ms |
| max | 1.84ms |
| total | 22.20ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.442)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.35ms | 0.68ms | -0.33ms | -48.20% |
| p50 | 0.46ms | 0.72ms | -0.26ms | -36.55% |
| p95 | 0.76ms | 0.95ms | -0.19ms | -19.64% |
| p99 | 0.80ms | 0.96ms | -0.15ms | -16.00% |
| mean | 0.49ms | 0.76ms | -0.26ms | -35.01% |
| min | 0.31ms | 0.65ms | -0.34ms | -52.90% |
| max | 0.81ms | 0.96ms | -0.14ms | -15.10% |
| total | 9.82ms | 15.10ms | -5.29ms | -35.01% |

