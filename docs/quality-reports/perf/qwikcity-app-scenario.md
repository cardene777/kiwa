# Perf Suite — qwikcity-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | 0.0076ms | 0.02ms | 100ms | 0.00041ms | PASS | stable (換算後 p10 +4% (閾値未満)、 p95 +94% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| route_action_form_batch (5 invokeRouteAction with FormData) | 0.0044ms | 0.0051ms | 100ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |
| loader_error_handling (5 throw + catch) | 0.02ms | 0.02ms | 100ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | cpu | 0.09ms | 0.10ms | 0.0076ms | 0.089 | 0.086 | 0.0074ms | 0.0071ms |
| route_action_form_batch (5 invokeRouteAction with FormData) | cpu | 0.08ms | 0.09ms | 0.0044ms | 0.053 | 0.052 | 0.0043ms | 0.0042ms |
| loader_error_handling (5 throw + catch) | cpu | 0.08ms | 0.09ms | 0.02ms | 0.256 | 0.248 | 0.02ms | 0.02ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | 0.05ms | 200ms | PASS |
| route_action_form_batch (5 invokeRouteAction with FormData) | 0.03ms | 200ms | PASS |
| loader_error_handling (5 throw + catch) | 0.10ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | 11312 B | 0 B | 102400 B | yes | PASS |
| route_action_form_batch (5 invokeRouteAction with FormData) | -8512 B | 0 B | 102400 B | yes | PASS |
| loader_error_handling (5 throw + catch) | 1264 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### route_loader_workflow (10 invokeRouteLoader)

# Perf Report — route_loader_workflow (10 invokeRouteLoader).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0076ms |
| p50 | 0.0083ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.010ms |
| stdev | 0.0049ms |
| min | 0.0073ms |
| max | 0.03ms |
| total | 0.20ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.977)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0074ms | 0.0071ms | +0.00031ms | +4.29% |
| p50 | 0.0081ms | 0.0073ms | +0.00081ms | +11.06% |
| p95 | 0.02ms | 0.0081ms | +0.0077ms | +94.19% |
| p99 | 0.03ms | 0.0084ms | +0.02ms | +209.91% |
| mean | 0.0097ms | 0.0074ms | +0.0023ms | +31.31% |
| min | 0.0071ms | 0.0070ms | +0.000079ms | +1.12% |
| max | 0.03ms | 0.0085ms | +0.02ms | +237.76% |
| total | 0.19ms | 0.15ms | +0.05ms | +31.31% |

### route_action_form_batch (5 invokeRouteAction with FormData)

# Perf Report — route_action_form_batch (5 invokeRouteAction with FormData).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0044ms |
| p50 | 0.0045ms |
| p95 | 0.0051ms |
| p99 | 0.0054ms |
| mean | 0.0046ms |
| stdev | 0.00029ms |
| min | 0.0042ms |
| max | 0.0055ms |
| total | 0.09ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.985)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0043ms | 0.0042ms | +0.00011ms | +2.49% |
| p50 | 0.0044ms | 0.0044ms | +0.000059ms | +1.35% |
| p95 | 0.0050ms | 0.0060ms | -0.00098ms | -16.41% |
| p99 | 0.0054ms | 0.0062ms | -0.00083ms | -13.36% |
| mean | 0.0045ms | 0.0047ms | -0.00016ms | -3.44% |
| min | 0.0041ms | 0.0042ms | -0.000020ms | -0.47% |
| max | 0.0055ms | 0.0063ms | -0.00079ms | -12.63% |
| total | 0.09ms | 0.09ms | -0.0032ms | -3.44% |

### loader_error_handling (5 throw + catch)

# Perf Report — loader_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.0010ms |
| min | 0.02ms |
| max | 0.02ms |
| total | 0.45ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.972)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00062ms | +3.12% |
| p50 | 0.02ms | 0.02ms | +0.0011ms | +5.29% |
| p95 | 0.02ms | 0.02ms | +0.00094ms | +4.13% |
| p99 | 0.02ms | 0.02ms | +0.00075ms | +3.24% |
| mean | 0.02ms | 0.02ms | +0.00093ms | +4.46% |
| min | 0.02ms | 0.02ms | +0.00050ms | +2.51% |
| max | 0.02ms | 0.02ms | +0.00070ms | +3.02% |
| total | 0.43ms | 0.42ms | +0.02ms | +4.46% |

