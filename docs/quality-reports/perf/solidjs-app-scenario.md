# Perf Suite — solidjs-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| render_workflow (10 renderSolid) | 0.01ms | 0.03ms | 100ms | 0.00046ms | PASS | stable (換算後 p10 -1% (閾値未満)、 p95 +32% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| signal_reactive_batch (5 signal+effect update chains) | 0.0049ms | 0.0068ms | 100ms | 0.00045ms | PASS | stable — gate 無効 (regressionGate=false) |
| render_error_handling (5 throw + catch in component) | 0.01ms | 0.05ms | 100ms | 0.00046ms | PASS | stable (換算後 p10 +4% (閾値未満)、 p95 +385% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| render_workflow (10 renderSolid) | cpu | 0.09ms | 0.13ms | 0.01ms | 0.113 | 0.114 | 0.0091ms | 0.0092ms |
| signal_reactive_batch (5 signal+effect update chains) | cpu | 0.09ms | 0.10ms | 0.0049ms | 0.055 | 0.054 | 0.0044ms | 0.0043ms |
| render_error_handling (5 throw + catch in component) | cpu | 0.09ms | 0.13ms | 0.01ms | 0.114 | 0.110 | 0.0093ms | 0.0090ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| render_workflow (10 renderSolid) | 0.06ms | 200ms | PASS |
| signal_reactive_batch (5 signal+effect update chains) | 0.03ms | 200ms | PASS |
| render_error_handling (5 throw + catch in component) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| render_workflow (10 renderSolid) | 368464 B | 0 B | 102400 B | yes | PASS |
| signal_reactive_batch (5 signal+effect update chains) | 5672 B | 0 B | 102400 B | yes | PASS |
| render_error_handling (5 throw + catch in component) | 5384 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### render_workflow (10 renderSolid)

# Perf Report — render_workflow (10 renderSolid).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.05ms |
| mean | 0.02ms |
| stdev | 0.0093ms |
| min | 0.010ms |
| max | 0.05ms |
| total | 0.32ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.911)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0091ms | 0.0092ms | -0.000057ms | -0.62% |
| p50 | 0.01ms | 0.01ms | +0.0025ms | +25.02% |
| p95 | 0.02ms | 0.02ms | +0.0056ms | +31.99% |
| p99 | 0.04ms | 0.02ms | +0.02ms | +110.17% |
| mean | 0.01ms | 0.01ms | +0.0029ms | +24.76% |
| min | 0.0091ms | 0.0091ms | -0.000013ms | -0.15% |
| max | 0.05ms | 0.02ms | +0.03ms | +126.77% |
| total | 0.29ms | 0.24ms | +0.06ms | +24.76% |

### signal_reactive_batch (5 signal+effect update chains)

# Perf Report — signal_reactive_batch (5 signal+effect update chains).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0049ms |
| p50 | 0.0050ms |
| p95 | 0.0068ms |
| p99 | 0.0080ms |
| mean | 0.0054ms |
| stdev | 0.00080ms |
| min | 0.0049ms |
| max | 0.0083ms |
| total | 0.11ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.893)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0044ms | 0.0043ms | +0.000099ms | +2.30% |
| p50 | 0.0045ms | 0.0044ms | +0.000084ms | +1.90% |
| p95 | 0.0061ms | 0.0058ms | +0.00021ms | +3.67% |
| p99 | 0.0071ms | 0.0073ms | -0.00017ms | -2.27% |
| mean | 0.0048ms | 0.0048ms | -0.000034ms | -0.71% |
| min | 0.0044ms | 0.0042ms | +0.00014ms | +3.42% |
| max | 0.0074ms | 0.0076ms | -0.00026ms | -3.41% |
| total | 0.10ms | 0.10ms | -0.00069ms | -0.71% |

### render_error_handling (5 throw + catch in component)

# Perf Report — render_error_handling (5 throw + catch in component).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.05ms |
| p99 | 0.06ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.06ms |
| total | 0.37ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.912)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0093ms | 0.0090ms | +0.00035ms | +3.93% |
| p50 | 0.0099ms | 0.0092ms | +0.00068ms | +7.34% |
| p95 | 0.05ms | 0.010ms | +0.04ms | +384.84% |
| p99 | 0.05ms | 0.01ms | +0.04ms | +437.69% |
| mean | 0.02ms | 0.0092ms | +0.0075ms | +81.50% |
| min | 0.0092ms | 0.0089ms | +0.00028ms | +3.17% |
| max | 0.06ms | 0.01ms | +0.05ms | +450.80% |
| total | 0.34ms | 0.18ms | +0.15ms | +81.50% |

