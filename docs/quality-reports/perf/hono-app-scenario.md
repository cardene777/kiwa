# Perf Suite — hono-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | 0.02ms | 0.03ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| rpc_client_batch (5 rpc calls) | 0.02ms | 0.02ms | 100ms | 0.00050ms | PASS | stable (換算後 p10 +18% (閾値未満)、 p95 +35% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| route_error_handling (5 throw + catch) | 0.03ms | 0.04ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | cpu | 0.08ms | 0.09ms | 0.02ms | 0.253 | 0.262 | 0.02ms | 0.02ms |
| rpc_client_batch (5 rpc calls) | cpu | 0.08ms | 0.08ms | 0.02ms | 0.182 | 0.154 | 0.02ms | 0.01ms |
| route_error_handling (5 throw + catch) | cpu | 0.08ms | 0.08ms | 0.03ms | 0.417 | 0.414 | 0.03ms | 0.03ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | 0.11ms | 200ms | PASS |
| rpc_client_batch (5 rpc calls) | 0.08ms | 200ms | PASS |
| route_error_handling (5 throw + catch) | 0.15ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | 32328 B | 0 B | 102400 B | yes | PASS |
| rpc_client_batch (5 rpc calls) | 960 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 throw + catch) | -224 B | 0 B | 102400 B | yes | PASS |

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
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.0039ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.48ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.981)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00080ms | -3.67% |
| p50 | 0.02ms | 0.02ms | +0.000033ms | +0.15% |
| p95 | 0.03ms | 0.03ms | +0.0012ms | +3.91% |
| p99 | 0.03ms | 0.03ms | +0.0048ms | +16.19% |
| mean | 0.02ms | 0.02ms | +0.000018ms | +0.08% |
| min | 0.02ms | 0.02ms | -0.00068ms | -3.21% |
| max | 0.04ms | 0.03ms | +0.0057ms | +19.24% |
| total | 0.47ms | 0.47ms | +0.00036ms | +0.08% |

### rpc_client_batch (5 rpc calls)

# Perf Report — rpc_client_batch (5 rpc calls).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.0016ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.33ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.002)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.01ms | +0.0023ms | +18.41% |
| p50 | 0.02ms | 0.01ms | +0.0028ms | +21.83% |
| p95 | 0.02ms | 0.01ms | +0.0050ms | +35.25% |
| p99 | 0.02ms | 0.01ms | +0.0058ms | +39.27% |
| mean | 0.02ms | 0.01ms | +0.0032ms | +24.74% |
| min | 0.01ms | 0.01ms | +0.0025ms | +20.18% |
| max | 0.02ms | 0.01ms | +0.0060ms | +40.23% |
| total | 0.33ms | 0.26ms | +0.06ms | +24.74% |

### route_error_handling (5 throw + catch)

# Perf Report — route_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.04ms |
| stdev | 0.0013ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.71ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.990)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.00023ms | +0.70% |
| p50 | 0.03ms | 0.03ms | +0.00025ms | +0.72% |
| p95 | 0.04ms | 0.04ms | +0.0014ms | +3.92% |
| p99 | 0.04ms | 0.04ms | +0.0026ms | +7.32% |
| mean | 0.04ms | 0.03ms | +0.00045ms | +1.31% |
| min | 0.03ms | 0.03ms | +0.00028ms | +0.83% |
| max | 0.04ms | 0.04ms | +0.0029ms | +8.18% |
| total | 0.70ms | 0.69ms | +0.0091ms | +1.31% |

