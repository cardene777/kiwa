# Perf Suite — macos-app-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | 0.01ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| a11y_batch (5 accessibility tree capture) | 0.0030ms | 0.0059ms | 100ms | 0.00050ms | PASS | stable (換算後 p10 +8% (閾値未満)、 p95 +24% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| notification_error_handling (5 empty title/body reject) | 0.0014ms | 0.0020ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.04ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.0096ms | 0.02ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | cpu | 0.08ms | 0.09ms | 0.01ms | 0.181 | 0.185 | 0.01ms | 0.02ms |
| a11y_batch (5 accessibility tree capture) | cpu | 0.08ms | 0.08ms | 0.0030ms | 0.037 | 0.035 | 0.0030ms | 0.0028ms |
| notification_error_handling (5 empty title/body reject) | cpu | 0.08ms | 0.08ms | 0.0014ms | 0.017 | 0.015 | 0.0014ms | 0.0012ms |
| retry_recovery (5 flaky async retry to success) | cpu | 0.08ms | 0.08ms | 0.03ms | 0.348 | 0.355 | 0.03ms | 0.03ms |
| concurrent_batch (5 batches of 4 items with error isolation) | cpu | 0.08ms | 0.09ms | 0.0096ms | 0.116 | 0.123 | 0.0093ms | 0.010ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | 0.06ms | 200ms | PASS |
| a11y_batch (5 accessibility tree capture) | 0.03ms | 200ms | PASS |
| notification_error_handling (5 empty title/body reject) | 0.01ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.12ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | -79336 B | 0 B | 102400 B | yes | PASS |
| a11y_batch (5 accessibility tree capture) | 6328 B | 0 B | 102400 B | yes | PASS |
| notification_error_handling (5 empty title/body reject) | 648 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 3296 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 2368 B | 0 B | 102400 B | yes | PASS |

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
| stdev | 0.0067ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.37ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.008)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.00031ms | -2.02% |
| p50 | 0.02ms | 0.02ms | -0.00025ms | -1.60% |
| p95 | 0.03ms | 0.03ms | -0.00057ms | -1.78% |
| p99 | 0.04ms | 0.04ms | -0.0022ms | -5.52% |
| mean | 0.02ms | 0.02ms | -0.00065ms | -3.35% |
| min | 0.01ms | 0.01ms | -0.00030ms | -2.03% |
| max | 0.04ms | 0.04ms | -0.0026ms | -6.25% |
| total | 0.38ms | 0.39ms | -0.01ms | -3.35% |

### a11y_batch (5 accessibility tree capture)

# Perf Report — a11y_batch (5 accessibility tree capture).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0030ms |
| p50 | 0.0041ms |
| p95 | 0.0059ms |
| p99 | 0.0063ms |
| mean | 0.0041ms |
| stdev | 0.0010ms |
| min | 0.0030ms |
| max | 0.0063ms |
| total | 0.08ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.993)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0030ms | 0.0028ms | +0.00022ms | +8.06% |
| p50 | 0.0041ms | 0.0029ms | +0.0012ms | +41.44% |
| p95 | 0.0059ms | 0.0048ms | +0.0011ms | +24.06% |
| p99 | 0.0062ms | 0.0048ms | +0.0014ms | +29.81% |
| mean | 0.0041ms | 0.0031ms | +0.00092ms | +29.28% |
| min | 0.0030ms | 0.0027ms | +0.00023ms | +8.31% |
| max | 0.0063ms | 0.0048ms | +0.0015ms | +31.24% |
| total | 0.08ms | 0.06ms | +0.02ms | +29.28% |

### notification_error_handling (5 empty title/body reject)

# Perf Report — notification_error_handling (5 empty title/body reject).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0014ms |
| p50 | 0.0015ms |
| p95 | 0.0020ms |
| p99 | 0.0038ms |
| mean | 0.0016ms |
| stdev | 0.00062ms |
| min | 0.0014ms |
| max | 0.0042ms |
| total | 0.03ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.991)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0014ms | 0.0012ms | +0.00015ms | +12.82% |
| p50 | 0.0014ms | 0.0013ms | +0.00020ms | +15.62% |
| p95 | 0.0020ms | 0.0023ms | -0.00032ms | -14.01% |
| p99 | 0.0037ms | 0.0049ms | -0.0012ms | -23.73% |
| mean | 0.0016ms | 0.0015ms | +0.000073ms | +4.78% |
| min | 0.0014ms | 0.0012ms | +0.00015ms | +12.82% |
| max | 0.0042ms | 0.0055ms | -0.0014ms | -24.74% |
| total | 0.03ms | 0.03ms | +0.0015ms | +4.78% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0035ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.64ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.005)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.00051ms | -1.74% |
| p50 | 0.03ms | 0.03ms | -0.0029ms | -8.69% |
| p95 | 0.04ms | 0.09ms | -0.05ms | -58.53% |
| p99 | 0.04ms | 0.13ms | -0.09ms | -69.27% |
| mean | 0.03ms | 0.04ms | -0.01ms | -27.46% |
| min | 0.03ms | 0.03ms | -0.00028ms | -0.98% |
| max | 0.04ms | 0.14ms | -0.10ms | -71.01% |
| total | 0.64ms | 0.88ms | -0.24ms | -27.46% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0096ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0032ms |
| min | 0.0093ms |
| max | 0.02ms |
| total | 0.23ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.972)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0093ms | 0.010ms | -0.00062ms | -6.27% |
| p50 | 0.0098ms | 0.01ms | -0.00066ms | -6.31% |
| p95 | 0.02ms | 0.02ms | -0.00043ms | -2.36% |
| p99 | 0.02ms | 0.02ms | -0.0037ms | -15.28% |
| mean | 0.01ms | 0.01ms | -0.00072ms | -6.10% |
| min | 0.0091ms | 0.0099ms | -0.00085ms | -8.54% |
| max | 0.02ms | 0.03ms | -0.0045ms | -17.56% |
| total | 0.22ms | 0.24ms | -0.01ms | -6.10% |

