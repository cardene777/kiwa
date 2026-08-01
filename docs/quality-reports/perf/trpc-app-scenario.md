# Perf Suite — trpc-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 0.0050ms | 0.0094ms | 100ms | 0.00047ms | PASS | stable — gate 無効 (regressionGate=false) |
| mutation_batch (5 authenticated mutation) | 0.0030ms | 0.0040ms | 100ms | 0.00048ms | PASS | stable — gate 無効 (regressionGate=false) |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 0.02ms | 0.03ms | 100ms | 0.00044ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky handler retry to success) | 0.02ms | 0.03ms | 100ms | 0.00046ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 0.0091ms | 0.06ms | 100ms | 0.00046ms | PASS | stable (換算後 p10 +10% (閾値未満)、 p95 +153% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | cpu | 0.09ms | 0.12ms | 0.0050ms | 0.056 | 0.057 | n/a | 20.0% | 0.0047ms | 0.0048ms |
| mutation_batch (5 authenticated mutation) | cpu | 0.09ms | 0.09ms | 0.0030ms | 0.032 | 0.032 | n/a | 20.0% | 0.0028ms | 0.0028ms |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | cpu | 0.09ms | 0.09ms | 0.02ms | 0.191 | 0.189 | n/a | 20.0% | 0.02ms | 0.02ms |
| retry_recovery (5 flaky handler retry to success) | cpu | 0.09ms | 0.09ms | 0.02ms | 0.194 | 0.201 | n/a | 20.0% | 0.02ms | 0.02ms |
| concurrent_batch (5 batchInvoke of 4 procedures each) | cpu | 0.09ms | 0.12ms | 0.0091ms | 0.102 | 0.093 | n/a | 20.0% | 0.0084ms | 0.0076ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 0.04ms | 200ms | PASS |
| mutation_batch (5 authenticated mutation) | 0.03ms | 200ms | PASS |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 0.09ms | 200ms | PASS |
| retry_recovery (5 flaky handler retry to success) | 0.07ms | 200ms | PASS |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 0.76ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 9048 B | -15928 B | 102400 B | yes | 23 (3 + 20) | PASS |
| mutation_batch (5 authenticated mutation) | 1504 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 664 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| retry_recovery (5 flaky handler retry to success) | 664 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 768 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### router_dispatch_workflow (10 query mix via client)

# Perf Report — router_dispatch_workflow (10 query mix via client).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0050ms |
| p50 | 0.0051ms |
| p95 | 0.0094ms |
| p99 | 0.02ms |
| mean | 0.0063ms |
| stdev | 0.0034ms |
| min | 0.0049ms |
| max | 0.02ms |
| total | 0.13ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.939)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0047ms | 0.0048ms | -0.000083ms | -1.74% |
| p50 | 0.0048ms | 0.0068ms | -0.0019ms | -28.40% |
| p95 | 0.0089ms | 0.05ms | -0.04ms | -82.76% |
| p99 | 0.02ms | 0.07ms | -0.05ms | -75.43% |
| mean | 0.0059ms | 0.01ms | -0.0078ms | -56.74% |
| min | 0.0046ms | 0.0045ms | +0.000076ms | +1.67% |
| max | 0.02ms | 0.07ms | -0.05ms | -74.14% |
| total | 0.12ms | 0.27ms | -0.16ms | -56.74% |

### mutation_batch (5 authenticated mutation)

# Perf Report — mutation_batch (5 authenticated mutation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0030ms |
| p50 | 0.0031ms |
| p95 | 0.0040ms |
| p99 | 0.0041ms |
| mean | 0.0032ms |
| stdev | 0.00031ms |
| min | 0.0029ms |
| max | 0.0041ms |
| total | 0.06ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.955)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0028ms | 0.0028ms | -0.0000072ms | -0.25% |
| p50 | 0.0030ms | 0.0030ms | +0.0000063ms | +0.21% |
| p95 | 0.0038ms | 0.0041ms | -0.00032ms | -7.79% |
| p99 | 0.0039ms | 0.0045ms | -0.00058ms | -12.90% |
| mean | 0.0030ms | 0.0031ms | -0.000064ms | -2.06% |
| min | 0.0028ms | 0.0028ms | -0.0000063ms | -0.23% |
| max | 0.0039ms | 0.0046ms | -0.00064ms | -14.05% |
| total | 0.06ms | 0.06ms | -0.0013ms | -2.06% |

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
| stdev | 0.0029ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.40ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.887)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00019ms | +1.22% |
| p50 | 0.02ms | 0.02ms | -0.0016ms | -8.95% |
| p95 | 0.02ms | 0.02ms | +0.00047ms | +2.08% |
| p99 | 0.02ms | 0.02ms | -0.00018ms | -0.75% |
| mean | 0.02ms | 0.02ms | -0.00024ms | -1.34% |
| min | 0.02ms | 0.02ms | +0.00020ms | +1.28% |
| max | 0.02ms | 0.02ms | -0.00034ms | -1.39% |
| total | 0.36ms | 0.36ms | -0.0049ms | -1.34% |

### retry_recovery (5 flaky handler retry to success)

# Perf Report — retry_recovery (5 flaky handler retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0038ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.41ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.924)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00061ms | -3.53% |
| p50 | 0.02ms | 0.02ms | -0.0012ms | -6.33% |
| p95 | 0.03ms | 0.04ms | -0.01ms | -35.60% |
| p99 | 0.03ms | 0.04ms | -0.01ms | -29.09% |
| mean | 0.02ms | 0.02ms | -0.0024ms | -11.33% |
| min | 0.02ms | 0.02ms | -0.00048ms | -2.82% |
| max | 0.03ms | 0.04ms | -0.01ms | -27.50% |
| total | 0.38ms | 0.43ms | -0.05ms | -11.33% |

### concurrent_batch (5 batchInvoke of 4 procedures each)

# Perf Report — concurrent_batch (5 batchInvoke of 4 procedures each).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0091ms |
| p50 | 0.02ms |
| p95 | 0.06ms |
| p99 | 0.15ms |
| mean | 0.03ms |
| stdev | 0.04ms |
| min | 0.0088ms |
| max | 0.17ms |
| total | 0.58ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.928)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0084ms | 0.0076ms | +0.00079ms | +10.41% |
| p50 | 0.02ms | 0.0083ms | +0.01ms | +130.32% |
| p95 | 0.05ms | 0.02ms | +0.03ms | +153.46% |
| p99 | 0.14ms | 0.02ms | +0.12ms | +564.21% |
| mean | 0.03ms | 0.01ms | +0.02ms | +155.35% |
| min | 0.0081ms | 0.0068ms | +0.0013ms | +18.80% |
| max | 0.16ms | 0.02ms | +0.14ms | +662.66% |
| total | 0.54ms | 0.21ms | +0.33ms | +155.35% |

