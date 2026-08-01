# Perf Suite — e2e-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 1.54ms | 2.88ms | 300ms | 0.00048ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_read_batch (5 GET via Promise.all) | 0.36ms | 0.45ms | 300ms | 0.00045ms | PASS | stable — gate 無効 (regressionGate=false) |
| server_error_handling (5 GET /fail 500 responses) | 0.43ms | 1.56ms | 300ms | 0.00045ms | PASS | stable (換算後 p10 -0% (閾値未満)、 p95 +100% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | cpu | 0.09ms | 0.10ms | 1.54ms | 17.845 | 19.972 | n/a | 20.0% | 1.48ms | 1.66ms |
| concurrent_read_batch (5 GET via Promise.all) | cpu | 0.09ms | 0.09ms | 0.36ms | 4.026 | 4.418 | n/a | 20.0% | 0.33ms | 0.36ms |
| server_error_handling (5 GET /fail 500 responses) | cpu | 0.09ms | 0.12ms | 0.43ms | 4.771 | 4.773 | n/a | 20.0% | 0.39ms | 0.39ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 7.68ms | 600ms | PASS |
| concurrent_read_batch (5 GET via Promise.all) | 1.30ms | 600ms | PASS |
| server_error_handling (5 GET /fail 500 responses) | 1.95ms | 600ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 2592 B | -51568 B | 102400 B | yes | 33 (3 + 30) | PASS |
| concurrent_read_batch (5 GET via Promise.all) | -5224 B | -18004 B | 102400 B | yes | 33 (3 + 30) | PASS |
| server_error_handling (5 GET /fail 500 responses) | -3744 B | 14038 B | 102400 B | yes | 33 (3 + 30) | PASS |

## Detailed serial reports

### rest_workflow (POST create + GET read + DELETE cycle x3)

# Perf Report — rest_workflow (POST create + GET read + DELETE cycle x3).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 1.54ms |
| p50 | 1.93ms |
| p95 | 2.88ms |
| p99 | 3.15ms |
| mean | 2.05ms |
| stdev | 0.48ms |
| min | 1.25ms |
| max | 3.23ms |
| total | 61.63ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.963)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 1.48ms | 1.66ms | -0.18ms | -10.65% |
| p50 | 1.85ms | 2.32ms | -0.47ms | -20.21% |
| p95 | 2.77ms | 3.15ms | -0.38ms | -11.95% |
| p99 | 3.04ms | 4.50ms | -1.46ms | -32.50% |
| mean | 1.98ms | 2.37ms | -0.39ms | -16.57% |
| min | 1.21ms | 1.39ms | -0.18ms | -13.15% |
| max | 3.11ms | 5.01ms | -1.90ms | -37.86% |
| total | 59.33ms | 71.12ms | -11.79ms | -16.57% |

### concurrent_read_batch (5 GET via Promise.all)

# Perf Report — concurrent_read_batch (5 GET via Promise.all).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.36ms |
| p50 | 0.39ms |
| p95 | 0.45ms |
| p99 | 0.67ms |
| mean | 0.40ms |
| stdev | 0.07ms |
| min | 0.36ms |
| max | 0.76ms |
| total | 12.04ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.896)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.33ms | 0.36ms | -0.03ms | -8.87% |
| p50 | 0.35ms | 0.39ms | -0.04ms | -10.86% |
| p95 | 0.40ms | 0.57ms | -0.17ms | -29.44% |
| p99 | 0.60ms | 0.88ms | -0.28ms | -32.26% |
| mean | 0.36ms | 0.43ms | -0.07ms | -16.51% |
| min | 0.32ms | 0.34ms | -0.02ms | -4.97% |
| max | 0.68ms | 1.01ms | -0.33ms | -32.52% |
| total | 10.79ms | 12.93ms | -2.14ms | -16.51% |

### server_error_handling (5 GET /fail 500 responses)

# Perf Report — server_error_handling (5 GET /fail 500 responses).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.43ms |
| p50 | 0.68ms |
| p95 | 1.56ms |
| p99 | 1.64ms |
| mean | 0.78ms |
| stdev | 0.36ms |
| min | 0.40ms |
| max | 1.66ms |
| total | 23.53ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.905)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.39ms | 0.39ms | -0.00021ms | -0.05% |
| p50 | 0.62ms | 0.50ms | +0.12ms | +23.15% |
| p95 | 1.41ms | 0.71ms | +0.70ms | +99.80% |
| p99 | 1.48ms | 0.71ms | +0.77ms | +107.89% |
| mean | 0.71ms | 0.52ms | +0.19ms | +36.55% |
| min | 0.36ms | 0.38ms | -0.01ms | -3.52% |
| max | 1.50ms | 0.72ms | +0.78ms | +109.46% |
| total | 21.28ms | 15.59ms | +5.70ms | +36.55% |

