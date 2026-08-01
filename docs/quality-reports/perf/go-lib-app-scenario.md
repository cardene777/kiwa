# Perf Suite — go-lib-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00058ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 0.0064ms | 0.07ms | 100ms | 0.00094ms | PASS | stable (換算後 p10 +0% (閾値未満)、 p95 +83% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| rest_batch (5 POST + GET + DELETE via chi router) | 0.05ms | 0.08ms | 100ms | 0.00081ms | PASS | regressed — gate 無効 (regressionGate=false) |
| route_error_handling (5 unmatched 404 + echo handler error) | 0.03ms | 0.03ms | 100ms | 0.00080ms | PASS | regressed — gate 無効 (regressionGate=false) |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 6.83ms | 9.05ms | 200ms | 0.00084ms | PASS | improved — gate 無効 (regressionGate=false) |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 0.0065ms | 0.01ms | 100ms | 0.00097ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | cpu | 0.10ms | 0.13ms | 0.0064ms | 0.064 | 0.064 | n/a | 20.0% | 0.0052ms | 0.0052ms |
| rest_batch (5 POST + GET + DELETE via chi router) | cpu | 0.12ms | 0.13ms | 0.05ms | 0.400 | 0.177 | n/a | 20.0% | 0.03ms | 0.01ms |
| route_error_handling (5 unmatched 404 + echo handler error) | cpu | 0.12ms | 0.12ms | 0.03ms | 0.212 | 0.122 | n/a | 20.0% | 0.02ms | 0.0099ms |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | cpu | 0.12ms | 0.22ms | 6.83ms | 59.366 | 77.589 | n/a | 20.0% | 4.92ms | 6.43ms |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | cpu | 0.10ms | 0.10ms | 0.0065ms | 0.066 | 0.070 | n/a | 20.0% | 0.0054ms | 0.0057ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 0.03ms | 200ms | PASS |
| rest_batch (5 POST + GET + DELETE via chi router) | 0.28ms | 200ms | PASS |
| route_error_handling (5 unmatched 404 + echo handler error) | 0.14ms | 200ms | PASS |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 20.37ms | 400ms | PASS |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | -14344 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| rest_batch (5 POST + GET + DELETE via chi router) | -312 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| route_error_handling (5 unmatched 404 + echo handler error) | 1600 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 12824 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | -8872 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### 4_framework_workflow (10 dispatch across gin/echo/fiber/chi)

# Perf Report — 4_framework_workflow (10 dispatch across gin/echo/fiber/chi).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0064ms |
| p50 | 0.0071ms |
| p95 | 0.07ms |
| p99 | 0.09ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.0063ms |
| max | 0.09ms |
| total | 0.30ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.808)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0052ms | 0.0052ms | +0.000012ms | +0.23% |
| p50 | 0.0057ms | 0.0057ms | -0.000026ms | -0.46% |
| p95 | 0.06ms | 0.03ms | +0.03ms | +82.58% |
| p99 | 0.07ms | 0.03ms | +0.04ms | +114.29% |
| mean | 0.01ms | 0.0089ms | +0.0033ms | +37.29% |
| min | 0.0051ms | 0.0051ms | -0.000032ms | -0.64% |
| max | 0.07ms | 0.03ms | +0.04ms | +121.90% |
| total | 0.25ms | 0.18ms | +0.07ms | +37.29% |

### rest_batch (5 POST + GET + DELETE via chi router)

# Perf Report — rest_batch (5 POST + GET + DELETE via chi router).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.05ms |
| p95 | 0.08ms |
| p99 | 0.09ms |
| mean | 0.06ms |
| stdev | 0.01ms |
| min | 0.04ms |
| max | 0.09ms |
| total | 1.15ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.694)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.01ms | +0.02ms | +126.27% |
| p50 | 0.04ms | 0.02ms | +0.02ms | +114.85% |
| p95 | 0.05ms | 0.03ms | +0.03ms | +102.26% |
| p99 | 0.06ms | 0.03ms | +0.03ms | +93.09% |
| mean | 0.04ms | 0.02ms | +0.02ms | +115.59% |
| min | 0.03ms | 0.01ms | +0.02ms | +115.92% |
| max | 0.06ms | 0.03ms | +0.03ms | +91.31% |
| total | 0.80ms | 0.37ms | +0.43ms | +115.59% |

### route_error_handling (5 unmatched 404 + echo handler error)

# Perf Report — route_error_handling (5 unmatched 404 + echo handler error).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.0064ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 0.54ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.686)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.0099ms | +0.0073ms | +73.73% |
| p50 | 0.02ms | 0.01ms | +0.0074ms | +73.11% |
| p95 | 0.02ms | 0.01ms | +0.0095ms | +89.74% |
| p99 | 0.03ms | 0.01ms | +0.02ms | +215.82% |
| mean | 0.02ms | 0.01ms | +0.0085ms | +84.11% |
| min | 0.02ms | 0.0097ms | +0.0074ms | +76.40% |
| max | 0.04ms | 0.01ms | +0.03ms | +247.11% |
| total | 0.37ms | 0.20ms | +0.17ms | +84.11% |

### v2.1 retry_workflow (5 flaky handler、 3 attempt で成功)

# Perf Report — v2.1 retry_workflow (5 flaky handler、 3 attempt で成功).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 6.83ms |
| p50 | 7.58ms |
| p95 | 9.05ms |
| p99 | 10.42ms |
| mean | 7.71ms |
| stdev | 1.17ms |
| min | 5.05ms |
| max | 10.77ms |
| total | 154.21ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.720)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 4.92ms | 6.43ms | -1.51ms | -23.49% |
| p50 | 5.46ms | 6.62ms | -1.16ms | -17.55% |
| p95 | 6.52ms | 7.01ms | -0.49ms | -7.04% |
| p99 | 7.51ms | 7.05ms | +0.46ms | +6.53% |
| mean | 5.55ms | 6.63ms | -1.08ms | -16.23% |
| min | 3.64ms | 6.35ms | -2.71ms | -42.72% |
| max | 7.75ms | 7.05ms | +0.70ms | +9.91% |
| total | 111.05ms | 132.57ms | -21.52ms | -16.23% |

### v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch)

# Perf Report — v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0065ms |
| p50 | 0.0069ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0082ms |
| stdev | 0.0030ms |
| min | 0.0065ms |
| max | 0.02ms |
| total | 0.16ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.832)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0054ms | 0.0057ms | -0.00034ms | -5.84% |
| p50 | 0.0058ms | 0.0064ms | -0.00060ms | -9.40% |
| p95 | 0.01ms | 0.03ms | -0.02ms | -57.93% |
| p99 | 0.01ms | 0.03ms | -0.01ms | -47.39% |
| mean | 0.0068ms | 0.0088ms | -0.0020ms | -23.00% |
| min | 0.0054ms | 0.0057ms | -0.00026ms | -4.53% |
| max | 0.02ms | 0.03ms | -0.01ms | -44.80% |
| total | 0.14ms | 0.18ms | -0.04ms | -23.00% |

