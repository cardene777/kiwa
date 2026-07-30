# Perf Suite — trpc-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 0.0053ms | 0.02ms | 100ms | 0.00045ms | PASS | stable — gate 無効 (regressionGate=false) |
| mutation_batch (5 authenticated mutation) | 0.0036ms | 0.0055ms | 100ms | 0.00048ms | PASS | regressed — gate 無効 (regressionGate=false) |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 0.02ms | 0.03ms | 100ms | 0.00044ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky handler retry to success) | 0.02ms | 0.09ms | 100ms | 0.00048ms | PASS | stable (換算後 p10 +6% (閾値未満)、 p95 +109% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 0.0092ms | 0.05ms | 100ms | 0.00044ms | PASS | stable (換算後 p10 +7% (閾値未満)、 p95 +99% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | cpu | 0.09ms | 0.24ms | 0.0053ms | 0.057 | 0.057 | 0.0047ms | 0.0048ms |
| mutation_batch (5 authenticated mutation) | cpu | 0.09ms | 0.10ms | 0.0036ms | 0.039 | 0.032 | 0.0034ms | 0.0028ms |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | cpu | 0.09ms | 0.10ms | 0.02ms | 0.188 | 0.189 | 0.02ms | 0.02ms |
| retry_recovery (5 flaky handler retry to success) | cpu | 0.09ms | 0.16ms | 0.02ms | 0.213 | 0.201 | 0.02ms | 0.02ms |
| concurrent_batch (5 batchInvoke of 4 procedures each) | cpu | 0.09ms | 0.13ms | 0.0092ms | 0.099 | 0.093 | 0.0082ms | 0.0076ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 0.08ms | 200ms | PASS |
| mutation_batch (5 authenticated mutation) | 0.03ms | 200ms | PASS |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 0.16ms | 200ms | PASS |
| retry_recovery (5 flaky handler retry to success) | 0.18ms | 200ms | PASS |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 8248 B | 0 B | 102400 B | yes | PASS |
| mutation_batch (5 authenticated mutation) | 1600 B | 0 B | 102400 B | yes | PASS |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 488 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky handler retry to success) | 11128 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 5088 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### router_dispatch_workflow (10 query mix via client)

# Perf Report — router_dispatch_workflow (10 query mix via client).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0053ms |
| p50 | 0.0057ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0078ms |
| stdev | 0.0060ms |
| min | 0.0052ms |
| max | 0.03ms |
| total | 0.16ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.897)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0047ms | 0.0048ms | -0.000033ms | -0.70% |
| p50 | 0.0051ms | 0.0068ms | -0.0016ms | -24.16% |
| p95 | 0.01ms | 0.05ms | -0.04ms | -72.25% |
| p99 | 0.03ms | 0.07ms | -0.04ms | -62.98% |
| mean | 0.0070ms | 0.01ms | -0.0067ms | -49.07% |
| min | 0.0046ms | 0.0045ms | +0.000092ms | +2.03% |
| max | 0.03ms | 0.07ms | -0.04ms | -61.34% |
| total | 0.14ms | 0.27ms | -0.13ms | -49.07% |

### mutation_batch (5 authenticated mutation)

# Perf Report — mutation_batch (5 authenticated mutation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0036ms |
| p50 | 0.0044ms |
| p95 | 0.0055ms |
| p99 | 0.0055ms |
| mean | 0.0045ms |
| stdev | 0.00069ms |
| min | 0.0031ms |
| max | 0.0055ms |
| total | 0.09ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.961)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0034ms | 0.0028ms | +0.00061ms | +21.41% |
| p50 | 0.0042ms | 0.0030ms | +0.0012ms | +42.12% |
| p95 | 0.0053ms | 0.0041ms | +0.0012ms | +28.71% |
| p99 | 0.0053ms | 0.0045ms | +0.00083ms | +18.50% |
| mean | 0.0043ms | 0.0031ms | +0.0012ms | +38.91% |
| min | 0.0030ms | 0.0028ms | +0.00021ms | +7.56% |
| max | 0.0053ms | 0.0046ms | +0.00074ms | +16.21% |
| total | 0.09ms | 0.06ms | +0.02ms | +38.91% |

### middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch)

# Perf Report — middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0030ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.40ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.884)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.000050ms | -0.32% |
| p50 | 0.02ms | 0.02ms | -0.0011ms | -6.23% |
| p95 | 0.02ms | 0.02ms | +0.00094ms | +4.17% |
| p99 | 0.02ms | 0.02ms | -0.00030ms | -1.25% |
| mean | 0.02ms | 0.02ms | -0.00026ms | -1.42% |
| min | 0.02ms | 0.02ms | -0.0000035ms | -0.02% |
| max | 0.02ms | 0.02ms | -0.00061ms | -2.49% |
| total | 0.36ms | 0.36ms | -0.0052ms | -1.42% |

### retry_recovery (5 flaky handler retry to success)

# Perf Report — retry_recovery (5 flaky handler retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.03ms |
| p95 | 0.09ms |
| p99 | 0.09ms |
| mean | 0.04ms |
| stdev | 0.03ms |
| min | 0.02ms |
| max | 0.10ms |
| total | 0.75ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.960)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00099ms | +5.69% |
| p50 | 0.03ms | 0.02ms | +0.0061ms | +31.94% |
| p95 | 0.09ms | 0.04ms | +0.04ms | +108.74% |
| p99 | 0.09ms | 0.04ms | +0.05ms | +116.73% |
| mean | 0.04ms | 0.02ms | +0.01ms | +67.91% |
| min | 0.02ms | 0.02ms | -0.00017ms | -0.98% |
| max | 0.09ms | 0.04ms | +0.05ms | +118.69% |
| total | 0.72ms | 0.43ms | +0.29ms | +67.91% |

### concurrent_batch (5 batchInvoke of 4 procedures each)

# Perf Report — concurrent_batch (5 batchInvoke of 4 procedures each).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0092ms |
| p50 | 0.0098ms |
| p95 | 0.05ms |
| p99 | 0.06ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.0088ms |
| max | 0.06ms |
| total | 0.32ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.888)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0082ms | 0.0076ms | +0.00052ms | +6.86% |
| p50 | 0.0087ms | 0.0083ms | +0.00042ms | +5.07% |
| p95 | 0.04ms | 0.02ms | +0.02ms | +99.31% |
| p99 | 0.05ms | 0.02ms | +0.03ms | +140.82% |
| mean | 0.01ms | 0.01ms | +0.0034ms | +32.15% |
| min | 0.0078ms | 0.0068ms | +0.0010ms | +14.77% |
| max | 0.05ms | 0.02ms | +0.03ms | +150.76% |
| total | 0.28ms | 0.21ms | +0.07ms | +32.15% |

