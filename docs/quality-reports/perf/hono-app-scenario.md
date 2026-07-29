# Perf Suite — hono-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | 0.02ms | 0.03ms | 100ms | 0.00051ms | PASS | stable — gate 無効 (regressionGate=false) |
| rpc_client_batch (5 rpc calls) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable (p10 +14% (閾値未満)、 p95 +28% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| route_error_handling (5 throw + catch) | 0.03ms | 0.04ms | 100ms | 0.00052ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | cpu | 0.08ms | 0.02ms | 0.246 | 0.268 | 0.02ms | 0.02ms |
| rpc_client_batch (5 rpc calls) | cpu | 0.08ms | 0.01ms | 0.179 | 0.157 | 0.01ms | 0.01ms |
| route_error_handling (5 throw + catch) | cpu | 0.08ms | 0.03ms | 0.419 | 0.411 | 0.03ms | 0.03ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | 0.10ms | 200ms | PASS |
| rpc_client_batch (5 rpc calls) | 0.07ms | 200ms | PASS |
| route_error_handling (5 throw + catch) | 0.15ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | -309344 B | 0 B | 102400 B | yes | PASS |
| rpc_client_batch (5 rpc calls) | -304 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 throw + catch) | 880 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### route_workflow (10 invokeRoute GET+POST mix)

# Perf Report — route_workflow (10 invokeRoute GET+POST mix).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0026ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0021ms | -9.62% |
| p50 | 0.02ms | 0.02ms | -0.0025ms | -10.86% |
| p95 | 0.03ms | 0.03ms | -0.0032ms | -10.44% |
| p99 | 0.03ms | 0.04ms | -0.0062ms | -17.59% |
| mean | 0.02ms | 0.02ms | -0.0026ms | -10.50% |
| min | 0.02ms | 0.02ms | -0.0014ms | -6.64% |
| max | 0.03ms | 0.04ms | -0.0069ms | -19.08% |
| total | 0.44ms | 0.49ms | -0.05ms | -10.50% |

### rpc_client_batch (5 rpc calls)

# Perf Report — rpc_client_batch (5 rpc calls).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.0016ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.0018ms | +13.66% |
| p50 | 0.02ms | 0.01ms | +0.0025ms | +18.82% |
| p95 | 0.02ms | 0.01ms | +0.0040ms | +26.99% |
| p99 | 0.02ms | 0.02ms | +0.0011ms | +5.92% |
| mean | 0.02ms | 0.01ms | +0.0023ms | +16.79% |
| min | 0.01ms | 0.01ms | -0.00033ms | -2.60% |
| max | 0.02ms | 0.02ms | +0.00033ms | +1.77% |
| total | 0.32ms | 0.27ms | +0.05ms | +16.79% |

### route_error_handling (5 throw + catch)

# Perf Report — route_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.04ms |
| stdev | 0.0015ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.70ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.00063ms | -1.84% |
| p50 | 0.03ms | 0.03ms | -0.000021ms | -0.06% |
| p95 | 0.04ms | 0.04ms | -0.00066ms | -1.72% |
| p99 | 0.04ms | 0.04ms | -0.0012ms | -3.01% |
| mean | 0.04ms | 0.04ms | -0.00025ms | -0.70% |
| min | 0.03ms | 0.03ms | -0.00083ms | -2.45% |
| max | 0.04ms | 0.04ms | -0.0013ms | -3.32% |
| total | 0.70ms | 0.71ms | -0.0050ms | -0.70% |

