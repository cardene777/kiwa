# Perf Suite — go-lib-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 0.0052ms | 0.03ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| rest_batch (5 POST + GET + DELETE via chi router) | 0.02ms | 0.10ms | 100ms | 0.00051ms | PASS | regressed — gate 無効 (regressionGate=false) |
| route_error_handling (5 unmatched 404 + echo handler error) | 0.01ms | 0.01ms | 100ms | 0.00049ms | PASS | stable (換算後 p10 +4% (閾値未満)、 p95 +34% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 5.45ms | 7.54ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 0.0059ms | 0.0095ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | cpu | 0.08ms | 0.09ms | 0.0052ms | 0.063 | 0.064 | 0.0051ms | 0.0052ms |
| rest_batch (5 POST + GET + DELETE via chi router) | cpu | 0.08ms | 0.15ms | 0.02ms | 0.245 | 0.177 | 0.02ms | 0.01ms |
| route_error_handling (5 unmatched 404 + echo handler error) | cpu | 0.08ms | 0.08ms | 0.01ms | 0.126 | 0.122 | 0.01ms | 0.0099ms |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | cpu | 0.08ms | 0.16ms | 5.45ms | 65.894 | 77.589 | 5.46ms | 6.43ms |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | cpu | 0.08ms | 0.09ms | 0.0059ms | 0.070 | 0.070 | 0.0058ms | 0.0057ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 0.03ms | 200ms | PASS |
| rest_batch (5 POST + GET + DELETE via chi router) | 0.10ms | 200ms | PASS |
| route_error_handling (5 unmatched 404 + echo handler error) | 0.06ms | 200ms | PASS |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 10.18ms | 400ms | PASS |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 8864 B | 0 B | 102400 B | yes | PASS |
| rest_batch (5 POST + GET + DELETE via chi router) | 1096 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 unmatched 404 + echo handler error) | 152 B | 0 B | 102400 B | yes | PASS |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 12888 B | -177 B | 102400 B | yes | PASS |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 17584 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### 4_framework_workflow (10 dispatch across gin/echo/fiber/chi)

# Perf Report — 4_framework_workflow (10 dispatch across gin/echo/fiber/chi).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0052ms |
| p50 | 0.0056ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.0099ms |
| stdev | 0.0094ms |
| min | 0.0051ms |
| max | 0.03ms |
| total | 0.20ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.985)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0051ms | 0.0052ms | -0.000079ms | -1.53% |
| p50 | 0.0055ms | 0.0057ms | -0.00025ms | -4.38% |
| p95 | 0.03ms | 0.03ms | -0.00017ms | -0.54% |
| p99 | 0.03ms | 0.03ms | -0.00097ms | -2.92% |
| mean | 0.0098ms | 0.0089ms | +0.00083ms | +9.26% |
| min | 0.0050ms | 0.0051ms | -0.000036ms | -0.71% |
| max | 0.03ms | 0.03ms | -0.0012ms | -3.49% |
| total | 0.20ms | 0.18ms | +0.02ms | +9.26% |

### rest_batch (5 POST + GET + DELETE via chi router)

# Perf Report — rest_batch (5 POST + GET + DELETE via chi router).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.03ms |
| p95 | 0.10ms |
| p99 | 0.13ms |
| mean | 0.04ms |
| stdev | 0.03ms |
| min | 0.02ms |
| max | 0.14ms |
| total | 0.73ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.011)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.01ms | +0.0056ms | +38.43% |
| p50 | 0.03ms | 0.02ms | +0.0098ms | +58.01% |
| p95 | 0.10ms | 0.03ms | +0.08ms | +292.50% |
| p99 | 0.13ms | 0.03ms | +0.10ms | +316.75% |
| mean | 0.04ms | 0.02ms | +0.02ms | +101.08% |
| min | 0.02ms | 0.01ms | +0.0040ms | +28.33% |
| max | 0.14ms | 0.03ms | +0.11ms | +321.46% |
| total | 0.74ms | 0.37ms | +0.37ms | +101.08% |

### route_error_handling (5 unmatched 404 + echo handler error)

# Perf Report — route_error_handling (5 unmatched 404 + echo handler error).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.04ms |
| mean | 0.01ms |
| stdev | 0.0066ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.26ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.987)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0099ms | +0.00036ms | +3.64% |
| p50 | 0.01ms | 0.01ms | +0.00091ms | +9.05% |
| p95 | 0.01ms | 0.01ms | +0.0036ms | +34.38% |
| p99 | 0.03ms | 0.01ms | +0.02ms | +228.06% |
| mean | 0.01ms | 0.01ms | +0.0026ms | +25.28% |
| min | 0.010ms | 0.0097ms | +0.00024ms | +2.45% |
| max | 0.04ms | 0.01ms | +0.03ms | +276.12% |
| total | 0.25ms | 0.20ms | +0.05ms | +25.28% |

### v2.1 retry_workflow (5 flaky handler、 3 attempt で成功)

# Perf Report — v2.1 retry_workflow (5 flaky handler、 3 attempt で成功).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 5.45ms |
| p50 | 5.92ms |
| p95 | 7.54ms |
| p99 | 8.23ms |
| mean | 6.03ms |
| stdev | 0.77ms |
| min | 4.76ms |
| max | 8.41ms |
| total | 120.51ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.002)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 5.46ms | 6.43ms | -0.97ms | -15.07% |
| p50 | 5.94ms | 6.62ms | -0.69ms | -10.37% |
| p95 | 7.55ms | 7.01ms | +0.54ms | +7.64% |
| p99 | 8.25ms | 7.05ms | +1.20ms | +17.09% |
| mean | 6.04ms | 6.63ms | -0.59ms | -8.92% |
| min | 4.77ms | 6.35ms | -1.59ms | -24.97% |
| max | 8.43ms | 7.05ms | +1.37ms | +19.44% |
| total | 120.75ms | 132.57ms | -11.82ms | -8.92% |

### v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch)

# Perf Report — v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0059ms |
| p50 | 0.0065ms |
| p95 | 0.0095ms |
| p99 | 0.02ms |
| mean | 0.0072ms |
| stdev | 0.0027ms |
| min | 0.0057ms |
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.982)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0058ms | 0.0057ms | +0.000013ms | +0.22% |
| p50 | 0.0063ms | 0.0064ms | -0.000015ms | -0.24% |
| p95 | 0.0093ms | 0.03ms | -0.02ms | -65.63% |
| p99 | 0.02ms | 0.03ms | -0.01ms | -42.38% |
| mean | 0.0071ms | 0.0088ms | -0.0017ms | -19.56% |
| min | 0.0056ms | 0.0057ms | -0.00010ms | -1.85% |
| max | 0.02ms | 0.03ms | -0.01ms | -36.68% |
| total | 0.14ms | 0.18ms | -0.03ms | -19.56% |

