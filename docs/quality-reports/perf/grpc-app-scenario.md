# Perf Suite — grpc-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | 0.0043ms | 0.0067ms | 100ms | 0.00043ms | PASS | stable — gate 無効 (regressionGate=false) |
| streaming_batch (5 server-stream + bidi mix) | 0.0099ms | 0.02ms | 100ms | 0.00037ms | PASS | regressed — gate 無効 (regressionGate=false) |
| error_status_batch (5 fail method returns INTERNAL) | 0.01ms | 0.02ms | 100ms | 0.00037ms | PASS | stable — gate 無効 (regressionGate=false) |
| interceptor_chain_batch (10 unary through auth+log) | 0.0077ms | 0.02ms | 100ms | 0.00041ms | PASS | stable (換算後 p10 +11% (閾値未満)、 p95 +147% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 0.0013ms | 0.0018ms | 100ms | 0.00046ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | cpu | 0.08ms | 0.09ms | 0.0043ms | 0.052 | 0.051 | 0.0044ms | 0.0042ms |
| streaming_batch (5 server-stream + bidi mix) | cpu | 0.09ms | 0.10ms | 0.0099ms | 0.106 | 0.079 | 0.0087ms | 0.0065ms |
| error_status_batch (5 fail method returns INTERNAL) | cpu | 0.09ms | 0.09ms | 0.01ms | 0.152 | 0.148 | 0.01ms | 0.01ms |
| interceptor_chain_batch (10 unary through auth+log) | cpu | 0.08ms | 0.10ms | 0.0077ms | 0.090 | 0.081 | 0.0075ms | 0.0067ms |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | cpu | 0.09ms | 0.09ms | 0.0013ms | 0.014 | 0.014 | 0.0014ms | 0.0014ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | 0.04ms | 200ms | PASS |
| streaming_batch (5 server-stream + bidi mix) | 0.06ms | 200ms | PASS |
| error_status_batch (5 fail method returns INTERNAL) | 0.08ms | 200ms | PASS |
| interceptor_chain_batch (10 unary through auth+log) | 0.04ms | 200ms | PASS |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 0.02ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | 7304 B | 0 B | 102400 B | yes | PASS |
| streaming_batch (5 server-stream + bidi mix) | -304 B | 0 B | 102400 B | yes | PASS |
| error_status_batch (5 fail method returns INTERNAL) | -2504 B | 0 B | 102400 B | yes | PASS |
| interceptor_chain_batch (10 unary through auth+log) | 17160 B | 0 B | 102400 B | yes | PASS |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 2968 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_service_workflow (10 invokeUnary across 4 providers)

# Perf Report — multi_service_workflow (10 invokeUnary across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0043ms |
| p50 | 0.0044ms |
| p95 | 0.0067ms |
| p99 | 0.0076ms |
| mean | 0.0048ms |
| stdev | 0.00090ms |
| min | 0.0043ms |
| max | 0.0078ms |
| total | 0.10ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.018)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0044ms | 0.0042ms | +0.00012ms | +2.80% |
| p50 | 0.0045ms | 0.0045ms | -0.000088ms | -1.93% |
| p95 | 0.0068ms | 0.07ms | -0.06ms | -90.22% |
| p99 | 0.0077ms | 0.09ms | -0.08ms | -91.14% |
| mean | 0.0049ms | 0.01ms | -0.0080ms | -62.17% |
| min | 0.0043ms | 0.0041ms | +0.00020ms | +4.90% |
| max | 0.0079ms | 0.09ms | -0.08ms | -91.32% |
| total | 0.10ms | 0.26ms | -0.16ms | -62.17% |

### streaming_batch (5 server-stream + bidi mix)

# Perf Report — streaming_batch (5 server-stream + bidi mix).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0099ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0050ms |
| min | 0.0095ms |
| max | 0.03ms |
| total | 0.25ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.875)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0087ms | 0.0065ms | +0.0022ms | +33.76% |
| p50 | 0.0092ms | 0.0068ms | +0.0023ms | +34.36% |
| p95 | 0.02ms | 0.02ms | -0.0045ms | -18.05% |
| p99 | 0.02ms | 0.03ms | -0.00052ms | -2.04% |
| mean | 0.01ms | 0.0091ms | +0.0016ms | +17.97% |
| min | 0.0083ms | 0.0065ms | +0.0019ms | +28.73% |
| max | 0.03ms | 0.03ms | +0.00047ms | +1.84% |
| total | 0.22ms | 0.18ms | +0.03ms | +17.97% |

### error_status_batch (5 fail method returns INTERNAL)

# Perf Report — error_status_batch (5 fail method returns INTERNAL).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.00098ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.31ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.884)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00030ms | +2.47% |
| p50 | 0.01ms | 0.01ms | +0.0011ms | +8.65% |
| p95 | 0.01ms | 0.01ms | -0.00012ms | -0.83% |
| p99 | 0.02ms | 0.02ms | -0.0017ms | -10.02% |
| mean | 0.01ms | 0.01ms | +0.00054ms | +4.15% |
| min | 0.01ms | 0.01ms | +0.00013ms | +1.06% |
| max | 0.02ms | 0.02ms | -0.0021ms | -11.99% |
| total | 0.27ms | 0.26ms | +0.01ms | +4.15% |

### interceptor_chain_batch (10 unary through auth+log)

# Perf Report — interceptor_chain_batch (10 unary through auth+log).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0077ms |
| p50 | 0.0084ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0056ms |
| min | 0.0073ms |
| max | 0.03ms |
| total | 0.22ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.977)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0075ms | 0.0067ms | +0.00074ms | +10.98% |
| p50 | 0.0082ms | 0.0070ms | +0.0012ms | +17.19% |
| p95 | 0.02ms | 0.0088ms | +0.01ms | +147.23% |
| p99 | 0.03ms | 0.02ms | +0.0030ms | +12.40% |
| mean | 0.01ms | 0.0081ms | +0.0027ms | +33.02% |
| min | 0.0071ms | 0.0066ms | +0.00046ms | +6.92% |
| max | 0.03ms | 0.03ms | +0.00050ms | +1.80% |
| total | 0.22ms | 0.16ms | +0.05ms | +33.02% |

### cancel_deadline_batch (5 cancel + 5 deadline expired)

# Perf Report — cancel_deadline_batch (5 cancel + 5 deadline expired).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0013ms |
| p50 | 0.0013ms |
| p95 | 0.0018ms |
| p99 | 0.0026ms |
| mean | 0.0015ms |
| stdev | 0.00034ms |
| min | 0.0013ms |
| max | 0.0028ms |
| total | 0.03ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.095)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0014ms | 0.0014ms | +0.0000016ms | +0.11% |
| p50 | 0.0015ms | 0.0014ms | +0.000044ms | +3.07% |
| p95 | 0.0020ms | 0.0032ms | -0.0012ms | -37.55% |
| p99 | 0.0029ms | 0.0050ms | -0.0021ms | -42.46% |
| mean | 0.0016ms | 0.0019ms | -0.00031ms | -16.29% |
| min | 0.0014ms | 0.0014ms | +0.000038ms | +2.80% |
| max | 0.0031ms | 0.0055ms | -0.0024ms | -43.17% |
| total | 0.03ms | 0.04ms | -0.0063ms | -16.29% |

