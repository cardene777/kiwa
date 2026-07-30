# Perf Suite — solidstart-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 0.0037ms | 0.0053ms | 100ms | 0.00047ms | PASS | stable — gate 無効 (regressionGate=false) |
| api_route_batch (5 invokeApiRoute) | 0.06ms | 0.10ms | 100ms | 0.00045ms | PASS | stable — gate 無効 (regressionGate=false) |
| fn_error_handling (5 throw + catch) | 0.01ms | 0.03ms | 100ms | 0.00046ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | cpu | 0.09ms | 0.11ms | 0.0037ms | 0.042 | 0.043 | 0.0035ms | 0.0035ms |
| api_route_batch (5 invokeApiRoute) | cpu | 0.09ms | 0.10ms | 0.06ms | 0.682 | 0.605 | 0.05ms | 0.05ms |
| fn_error_handling (5 throw + catch) | cpu | 0.09ms | 0.10ms | 0.01ms | 0.146 | 0.139 | 0.01ms | 0.01ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 0.03ms | 200ms | PASS |
| api_route_batch (5 invokeApiRoute) | 0.29ms | 200ms | PASS |
| fn_error_handling (5 throw + catch) | 0.07ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 10656 B | 0 B | 102400 B | yes | PASS |
| api_route_batch (5 invokeApiRoute) | 2464 B | -4860 B | 102400 B | yes | PASS |
| fn_error_handling (5 throw + catch) | -9488 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### server_function_workflow (10 invokeServerFunction)

# Perf Report — server_function_workflow (10 invokeServerFunction).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0037ms |
| p50 | 0.0039ms |
| p95 | 0.0053ms |
| p99 | 0.0058ms |
| mean | 0.0041ms |
| stdev | 0.00061ms |
| min | 0.0037ms |
| max | 0.0060ms |
| total | 0.08ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.936)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0035ms | 0.0035ms | -0.000071ms | -2.00% |
| p50 | 0.0036ms | 0.0036ms | +0.0000025ms | +0.07% |
| p95 | 0.0050ms | 0.0056ms | -0.00065ms | -11.55% |
| p99 | 0.0055ms | 0.01ms | -0.0086ms | -61.08% |
| mean | 0.0039ms | 0.0045ms | -0.00062ms | -13.80% |
| min | 0.0034ms | 0.0035ms | -0.000067ms | -1.92% |
| max | 0.0056ms | 0.02ms | -0.01ms | -65.41% |
| total | 0.08ms | 0.09ms | -0.01ms | -13.80% |

### api_route_batch (5 invokeApiRoute)

# Perf Report — api_route_batch (5 invokeApiRoute).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.06ms |
| p50 | 0.07ms |
| p95 | 0.10ms |
| p99 | 0.14ms |
| mean | 0.07ms |
| stdev | 0.02ms |
| min | 0.06ms |
| max | 0.15ms |
| total | 1.49ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.894)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | +0.0062ms | +12.77% |
| p50 | 0.06ms | 0.05ms | +0.0093ms | +17.47% |
| p95 | 0.09ms | 0.08ms | +0.0036ms | +4.45% |
| p99 | 0.12ms | 0.10ms | +0.02ms | +17.28% |
| mean | 0.07ms | 0.06ms | +0.0078ms | +13.20% |
| min | 0.05ms | 0.05ms | +0.0076ms | +16.49% |
| max | 0.13ms | 0.11ms | +0.02ms | +19.70% |
| total | 1.33ms | 1.18ms | +0.16ms | +13.20% |

### fn_error_handling (5 throw + catch)

# Perf Report — fn_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.0089ms |
| min | 0.01ms |
| max | 0.05ms |
| total | 0.37ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.918)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00063ms | +5.49% |
| p50 | 0.01ms | 0.01ms | +0.0015ms | +12.11% |
| p95 | 0.03ms | 0.03ms | -0.0029ms | -8.37% |
| p99 | 0.04ms | 0.06ms | -0.02ms | -29.28% |
| mean | 0.02ms | 0.02ms | +0.00087ms | +5.42% |
| min | 0.01ms | 0.01ms | +0.000066ms | +0.58% |
| max | 0.04ms | 0.06ms | -0.02ms | -32.17% |
| total | 0.34ms | 0.32ms | +0.02ms | +5.42% |

