# Perf Suite — qwikcity-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | 0.0071ms | 0.0088ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| route_action_form_batch (5 invokeRouteAction with FormData) | 0.0040ms | 0.0052ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| loader_error_handling (5 throw + catch) | 0.02ms | 0.02ms | 100ms | 0.00043ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | cpu | 0.08ms | 0.0071ms | 0.088 | 0.087 | 0.0071ms | 0.0070ms |
| route_action_form_batch (5 invokeRouteAction with FormData) | cpu | 0.08ms | 0.0040ms | 0.050 | 0.053 | 0.0040ms | 0.0042ms |
| loader_error_handling (5 throw + catch) | cpu | 0.08ms | 0.02ms | 0.248 | 0.247 | 0.02ms | 0.02ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | 0.04ms | 200ms | PASS |
| route_action_form_batch (5 invokeRouteAction with FormData) | 0.03ms | 200ms | PASS |
| loader_error_handling (5 throw + catch) | 0.09ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | 14208 B | 0 B | 102400 B | yes | PASS |
| route_action_form_batch (5 invokeRouteAction with FormData) | -7552 B | 0 B | 102400 B | yes | PASS |
| loader_error_handling (5 throw + catch) | 960 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### route_loader_workflow (10 invokeRouteLoader)

# Perf Report — route_loader_workflow (10 invokeRouteLoader).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0071ms |
| p50 | 0.0072ms |
| p95 | 0.0088ms |
| p99 | 0.0092ms |
| mean | 0.0075ms |
| stdev | 0.00065ms |
| min | 0.0070ms |
| max | 0.0093ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0071ms | 0.0070ms | +0.000083ms | +1.19% |
| p50 | 0.0072ms | 0.0074ms | -0.00017ms | -2.26% |
| p95 | 0.0088ms | 0.0084ms | +0.00044ms | +5.25% |
| p99 | 0.0092ms | 0.0084ms | +0.00079ms | +9.37% |
| mean | 0.0075ms | 0.0074ms | +0.00016ms | +2.20% |
| min | 0.0070ms | 0.0069ms | +0.00013ms | +1.82% |
| max | 0.0093ms | 0.0084ms | +0.00088ms | +10.40% |
| total | 0.15ms | 0.15ms | +0.0033ms | +2.20% |

### route_action_form_batch (5 invokeRouteAction with FormData)

# Perf Report — route_action_form_batch (5 invokeRouteAction with FormData).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0040ms |
| p50 | 0.0041ms |
| p95 | 0.0052ms |
| p99 | 0.0054ms |
| mean | 0.0043ms |
| stdev | 0.00040ms |
| min | 0.0040ms |
| max | 0.0055ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0040ms | 0.0042ms | -0.00020ms | -4.85% |
| p50 | 0.0041ms | 0.0044ms | -0.00027ms | -6.19% |
| p95 | 0.0052ms | 0.0065ms | -0.0013ms | -19.99% |
| p99 | 0.0054ms | 0.01ms | -0.0053ms | -49.45% |
| mean | 0.0043ms | 0.0049ms | -0.00062ms | -12.73% |
| min | 0.0040ms | 0.0042ms | -0.00021ms | -4.97% |
| max | 0.0055ms | 0.01ms | -0.0063ms | -53.54% |
| total | 0.09ms | 0.10ms | -0.01ms | -12.73% |

### loader_error_handling (5 throw + catch)

# Perf Report — loader_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0016ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.41ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00066ms | -3.24% |
| p50 | 0.02ms | 0.02ms | -0.00054ms | -2.60% |
| p95 | 0.02ms | 0.02ms | -0.00091ms | -3.96% |
| p99 | 0.03ms | 0.03ms | +0.00045ms | +1.76% |
| mean | 0.02ms | 0.02ms | -0.00049ms | -2.30% |
| min | 0.02ms | 0.02ms | -0.00071ms | -3.48% |
| max | 0.03ms | 0.03ms | +0.00079ms | +3.01% |
| total | 0.41ms | 0.42ms | -0.0098ms | -2.30% |

