# Perf Suite — rust-lib-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 0.0040ms | 0.04ms | 100ms | 0.00049ms | PASS | stable (p10 +4% (閾値未満)、 p95 +60% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| middleware_chain_batch (5 tower layer chains) | 0.0043ms | 0.0066ms | 100ms | 0.00049ms | PASS | regressed — gate 無効 (regressionGate=false) |
| route_error_handling (5 handler throw + catch) | 0.01ms | 0.01ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.03ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.0095ms | 0.01ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | cpu | 0.08ms | 0.0040ms | 0.049 | 0.047 | 0.0040ms | 0.0038ms |
| middleware_chain_batch (5 tower layer chains) | cpu | 0.08ms | 0.0043ms | 0.052 | 0.042 | 0.0042ms | 0.0034ms |
| route_error_handling (5 handler throw + catch) | cpu | 0.08ms | 0.01ms | 0.132 | 0.134 | 0.01ms | 0.01ms |
| retry_recovery (5 flaky async retry to success) | cpu | 0.08ms | 0.03ms | 0.320 | 0.329 | 0.03ms | 0.03ms |
| concurrent_batch (5 batches of 4 items with error isolation) | cpu | 0.08ms | 0.0095ms | 0.114 | 0.126 | 0.0093ms | 0.01ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 0.02ms | 200ms | PASS |
| middleware_chain_batch (5 tower layer chains) | 0.04ms | 200ms | PASS |
| route_error_handling (5 handler throw + catch) | 0.06ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.12ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 5336 B | 0 B | 102400 B | yes | PASS |
| middleware_chain_batch (5 tower layer chains) | 5664 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 handler throw + catch) | 1264 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | -2024 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 9824 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_handler_workflow (10 axum + actix + rocket mixed)

# Perf Report — rest_handler_workflow (10 axum + actix + rocket mixed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0040ms |
| p50 | 0.0044ms |
| p95 | 0.04ms |
| p99 | 0.07ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.0040ms |
| max | 0.08ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0040ms | 0.0038ms | +0.00025ms | +6.48% |
| p50 | 0.0044ms | 0.0040ms | +0.00044ms | +11.04% |
| p95 | 0.04ms | 0.02ms | +0.01ms | +63.03% |
| p99 | 0.07ms | 0.03ms | +0.04ms | +139.11% |
| mean | 0.01ms | 0.0072ms | +0.0037ms | +51.40% |
| min | 0.0040ms | 0.0035ms | +0.00046ms | +13.11% |
| max | 0.08ms | 0.03ms | +0.05ms | +151.52% |
| total | 0.22ms | 0.14ms | +0.07ms | +51.40% |

### middleware_chain_batch (5 tower layer chains)

# Perf Report — middleware_chain_batch (5 tower layer chains).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0043ms |
| p50 | 0.0046ms |
| p95 | 0.0066ms |
| p99 | 0.0076ms |
| mean | 0.0049ms |
| stdev | 0.00093ms |
| min | 0.0042ms |
| max | 0.0079ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0043ms | 0.0034ms | +0.00090ms | +26.35% |
| p50 | 0.0046ms | 0.0037ms | +0.00088ms | +23.59% |
| p95 | 0.0066ms | 0.01ms | -0.0035ms | -34.54% |
| p99 | 0.0076ms | 0.01ms | -0.0027ms | -25.90% |
| mean | 0.0049ms | 0.0045ms | +0.00048ms | +10.69% |
| min | 0.0042ms | 0.0034ms | +0.00075ms | +21.95% |
| max | 0.0079ms | 0.01ms | -0.0025ms | -23.79% |
| total | 0.10ms | 0.09ms | +0.0095ms | +10.69% |

### route_error_handling (5 handler throw + catch)

# Perf Report — route_error_handling (5 handler throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0018ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.000029ms | -0.27% |
| p50 | 0.01ms | 0.01ms | -0.00023ms | -2.04% |
| p95 | 0.01ms | 0.03ms | -0.01ms | -51.30% |
| p99 | 0.02ms | 0.04ms | -0.02ms | -56.36% |
| mean | 0.01ms | 0.01ms | -0.0024ms | -17.13% |
| min | 0.01ms | 0.01ms | +0.000084ms | +0.78% |
| max | 0.02ms | 0.04ms | -0.03ms | -57.14% |
| total | 0.23ms | 0.28ms | -0.05ms | -17.13% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.03ms |
| stdev | 0.0023ms |
| min | 0.03ms |
| max | 0.03ms |
| total | 0.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.00026ms | -0.96% |
| p50 | 0.03ms | 0.03ms | -0.00042ms | -1.49% |
| p95 | 0.03ms | 0.03ms | +0.0011ms | +3.43% |
| p99 | 0.03ms | 0.04ms | -0.0031ms | -8.27% |
| mean | 0.03ms | 0.03ms | -0.00054ms | -1.87% |
| min | 0.03ms | 0.03ms | -0.00033ms | -1.24% |
| max | 0.03ms | 0.04ms | -0.0042ms | -10.67% |
| total | 0.57ms | 0.58ms | -0.01ms | -1.87% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0095ms |
| p50 | 0.010ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0017ms |
| min | 0.0094ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0095ms | 0.01ms | -0.00084ms | -8.11% |
| p50 | 0.010ms | 0.01ms | -0.00092ms | -8.41% |
| p95 | 0.01ms | 0.02ms | -0.0061ms | -33.11% |
| p99 | 0.02ms | 0.02ms | -0.0045ms | -22.00% |
| mean | 0.01ms | 0.01ms | -0.0014ms | -11.44% |
| min | 0.0094ms | 0.01ms | -0.00075ms | -7.41% |
| max | 0.02ms | 0.02ms | -0.0042ms | -19.61% |
| total | 0.21ms | 0.24ms | -0.03ms | -11.44% |

