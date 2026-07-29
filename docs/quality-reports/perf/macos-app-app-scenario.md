# Perf Suite — macos-app-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | 0.01ms | 0.03ms | 100ms | 0.00052ms | PASS | stable — gate 無効 (regressionGate=false) |
| a11y_batch (5 accessibility tree capture) | 0.0029ms | 0.0048ms | 100ms | 0.00051ms | PASS | stable (p10 +0% (閾値未満)、 p95 +25% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| notification_error_handling (5 empty title/body reject) | 0.0013ms | 0.0021ms | 100ms | 0.00051ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.03ms | 100ms | 0.00051ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.0094ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | cpu | 0.08ms | 0.01ms | 0.184 | 0.186 | 0.02ms | 0.02ms |
| a11y_batch (5 accessibility tree capture) | cpu | 0.08ms | 0.0029ms | 0.036 | 0.036 | 0.0030ms | 0.0030ms |
| notification_error_handling (5 empty title/body reject) | cpu | 0.08ms | 0.0013ms | 0.017 | 0.015 | 0.0014ms | 0.0012ms |
| retry_recovery (5 flaky async retry to success) | cpu | 0.08ms | 0.03ms | 0.334 | 0.348 | 0.03ms | 0.03ms |
| concurrent_batch (5 batches of 4 items with error isolation) | cpu | 0.08ms | 0.0094ms | 0.117 | 0.120 | 0.0095ms | 0.0098ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | 0.07ms | 200ms | PASS |
| a11y_batch (5 accessibility tree capture) | 0.02ms | 200ms | PASS |
| notification_error_handling (5 empty title/body reject) | 0.01ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.12ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | -472 B | 0 B | 102400 B | yes | PASS |
| a11y_batch (5 accessibility tree capture) | -2616 B | 0 B | 102400 B | yes | PASS |
| notification_error_handling (5 empty title/body reject) | 648 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 3296 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 1328 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### user_flow_workflow (10 interaction+screencap cycle across modes)

# Perf Report — user_flow_workflow (10 interaction+screencap cycle across modes).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.0066ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.00066ms | -4.29% |
| p50 | 0.02ms | 0.02ms | -0.0014ms | -8.54% |
| p95 | 0.03ms | 0.03ms | -0.0019ms | -5.83% |
| p99 | 0.04ms | 0.04ms | -0.00028ms | -0.75% |
| mean | 0.02ms | 0.02ms | -0.00076ms | -3.87% |
| min | 0.01ms | 0.02ms | -0.0017ms | -11.02% |
| max | 0.04ms | 0.04ms | +0.00013ms | +0.32% |
| total | 0.38ms | 0.39ms | -0.02ms | -3.87% |

### a11y_batch (5 accessibility tree capture)

# Perf Report — a11y_batch (5 accessibility tree capture).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0029ms |
| p50 | 0.0030ms |
| p95 | 0.0048ms |
| p99 | 0.0051ms |
| mean | 0.0033ms |
| stdev | 0.00063ms |
| min | 0.0029ms |
| max | 0.0052ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0029ms | 0.0030ms | -0.000037ms | -1.25% |
| p50 | 0.0030ms | 0.0030ms | +5.0e-7ms | +0.02% |
| p95 | 0.0048ms | 0.0039ms | +0.00089ms | +23.06% |
| p99 | 0.0051ms | 0.0045ms | +0.00054ms | +11.98% |
| mean | 0.0033ms | 0.0032ms | +0.00013ms | +4.01% |
| min | 0.0029ms | 0.0029ms | +0.000041ms | +1.43% |
| max | 0.0052ms | 0.0047ms | +0.00046ms | +9.70% |
| total | 0.07ms | 0.06ms | +0.0025ms | +4.01% |

### notification_error_handling (5 empty title/body reject)

# Perf Report — notification_error_handling (5 empty title/body reject).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0013ms |
| p50 | 0.0014ms |
| p95 | 0.0021ms |
| p99 | 0.0036ms |
| mean | 0.0016ms |
| stdev | 0.00059ms |
| min | 0.0013ms |
| max | 0.0040ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0013ms | 0.0012ms | +0.00013ms | +10.42% |
| p50 | 0.0014ms | 0.0013ms | +0.00015ms | +11.64% |
| p95 | 0.0021ms | 0.0086ms | -0.0065ms | -75.99% |
| p99 | 0.0036ms | 0.01ms | -0.0074ms | -67.31% |
| mean | 0.0016ms | 0.0023ms | -0.00074ms | -31.67% |
| min | 0.0013ms | 0.0012ms | +0.00012ms | +10.71% |
| max | 0.0040ms | 0.01ms | -0.0077ms | -65.72% |
| total | 0.03ms | 0.05ms | -0.01ms | -31.67% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0030ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.0018ms | -6.18% |
| p50 | 0.03ms | 0.03ms | -0.0030ms | -9.63% |
| p95 | 0.03ms | 0.06ms | -0.03ms | -42.71% |
| p99 | 0.04ms | 0.06ms | -0.03ms | -43.43% |
| mean | 0.03ms | 0.04ms | -0.0059ms | -16.61% |
| min | 0.03ms | 0.03ms | -0.0012ms | -4.30% |
| max | 0.04ms | 0.07ms | -0.03ms | -43.59% |
| total | 0.59ms | 0.71ms | -0.12ms | -16.61% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0094ms |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0017ms |
| min | 0.0090ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0094ms | 0.0098ms | -0.00035ms | -3.61% |
| p50 | 0.01ms | 0.01ms | +0.000042ms | +0.41% |
| p95 | 0.01ms | 0.01ms | -0.00069ms | -5.27% |
| p99 | 0.02ms | 0.02ms | -0.0049ms | -23.06% |
| mean | 0.01ms | 0.01ms | -0.00044ms | -3.96% |
| min | 0.0090ms | 0.0094ms | -0.00038ms | -4.00% |
| max | 0.02ms | 0.02ms | -0.0059ms | -25.58% |
| total | 0.21ms | 0.22ms | -0.0088ms | -3.96% |

