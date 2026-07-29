# Perf Suite — grpc-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | 0.0049ms | 0.0057ms | 100ms | 0.00043ms | PASS | stable — gate 無効 (regressionGate=false) |
| streaming_batch (5 server-stream + bidi mix) | 0.0075ms | 0.02ms | 100ms | 0.00045ms | PASS | stable — gate 無効 (regressionGate=false) |
| error_status_batch (5 fail method returns INTERNAL) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| interceptor_chain_batch (10 unary through auth+log) | 0.0070ms | 0.01ms | 100ms | 0.00053ms | PASS | stable — gate 無効 (regressionGate=false) |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 0.0013ms | 0.0019ms | 100ms | 0.00047ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | cpu | 0.09ms | 0.0049ms | 0.052 | 0.052 | 0.0042ms | 0.0043ms |
| streaming_batch (5 server-stream + bidi mix) | cpu | 0.09ms | 0.0075ms | 0.081 | 0.083 | 0.0067ms | 0.0068ms |
| error_status_batch (5 fail method returns INTERNAL) | cpu | 0.08ms | 0.01ms | 0.157 | 0.156 | 0.01ms | 0.01ms |
| interceptor_chain_batch (10 unary through auth+log) | cpu | 0.08ms | 0.0070ms | 0.083 | 0.084 | 0.0074ms | 0.0075ms |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | cpu | 0.09ms | 0.0013ms | 0.015 | 0.015 | 0.0012ms | 0.0013ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | 0.03ms | 200ms | PASS |
| streaming_batch (5 server-stream + bidi mix) | 0.05ms | 200ms | PASS |
| error_status_batch (5 fail method returns INTERNAL) | 0.08ms | 200ms | PASS |
| interceptor_chain_batch (10 unary through auth+log) | 0.04ms | 200ms | PASS |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | -552 B | 0 B | 102400 B | yes | PASS |
| streaming_batch (5 server-stream + bidi mix) | 3144 B | 0 B | 102400 B | yes | PASS |
| error_status_batch (5 fail method returns INTERNAL) | -3368 B | 0 B | 102400 B | yes | PASS |
| interceptor_chain_batch (10 unary through auth+log) | 21472 B | 0 B | 102400 B | yes | PASS |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 976 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_service_workflow (10 invokeUnary across 4 providers)

# Perf Report — multi_service_workflow (10 invokeUnary across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0049ms |
| p50 | 0.0051ms |
| p95 | 0.0057ms |
| p99 | 0.0057ms |
| mean | 0.0052ms |
| stdev | 0.00027ms |
| min | 0.0048ms |
| max | 0.0057ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0049ms | 0.0043ms | +0.00066ms | +15.60% |
| p50 | 0.0051ms | 0.0044ms | +0.00073ms | +16.74% |
| p95 | 0.0057ms | 0.0052ms | +0.00042ms | +8.10% |
| p99 | 0.0057ms | 0.0058ms | -0.000081ms | -1.41% |
| mean | 0.0052ms | 0.0045ms | +0.00063ms | +13.80% |
| min | 0.0048ms | 0.0042ms | +0.00062ms | +14.85% |
| max | 0.0057ms | 0.0059ms | -0.00021ms | -3.52% |
| total | 0.10ms | 0.09ms | +0.01ms | +13.80% |

### streaming_batch (5 server-stream + bidi mix)

# Perf Report — streaming_batch (5 server-stream + bidi mix).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0075ms |
| p50 | 0.010ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0037ms |
| min | 0.0073ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0075ms | 0.0068ms | +0.00066ms | +9.71% |
| p50 | 0.010ms | 0.0073ms | +0.0027ms | +36.86% |
| p95 | 0.02ms | 0.02ms | -0.0035ms | -15.64% |
| p99 | 0.02ms | 0.06ms | -0.04ms | -67.99% |
| mean | 0.01ms | 0.01ms | -0.0017ms | -13.58% |
| min | 0.0073ms | 0.0067ms | +0.00063ms | +9.33% |
| max | 0.02ms | 0.07ms | -0.05ms | -71.98% |
| total | 0.21ms | 0.25ms | -0.03ms | -13.58% |

### error_status_batch (5 fail method returns INTERNAL)

# Perf Report — error_status_batch (5 fail method returns INTERNAL).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0010ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00017ms | +1.33% |
| p50 | 0.01ms | 0.01ms | +0.0010ms | +7.55% |
| p95 | 0.02ms | 0.02ms | -0.0056ms | -26.17% |
| p99 | 0.02ms | 0.05ms | -0.03ms | -65.75% |
| mean | 0.01ms | 0.02ms | -0.0016ms | -10.16% |
| min | 0.01ms | 0.01ms | +0.00042ms | +3.32% |
| max | 0.02ms | 0.06ms | -0.04ms | -69.58% |
| total | 0.29ms | 0.32ms | -0.03ms | -10.16% |

### interceptor_chain_batch (10 unary through auth+log)

# Perf Report — interceptor_chain_batch (10 unary through auth+log).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0070ms |
| p50 | 0.0077ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0091ms |
| stdev | 0.0049ms |
| min | 0.0069ms |
| max | 0.03ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0070ms | 0.0075ms | -0.00047ms | -6.22% |
| p50 | 0.0077ms | 0.0080ms | -0.00038ms | -4.67% |
| p95 | 0.01ms | 0.02ms | -0.0023ms | -13.64% |
| p99 | 0.03ms | 0.03ms | -0.0053ms | -17.01% |
| mean | 0.0091ms | 0.01ms | -0.0012ms | -11.47% |
| min | 0.0069ms | 0.0074ms | -0.00046ms | -6.21% |
| max | 0.03ms | 0.03ms | -0.0060ms | -17.43% |
| total | 0.18ms | 0.21ms | -0.02ms | -11.47% |

### cancel_deadline_batch (5 cancel + 5 deadline expired)

# Perf Report — cancel_deadline_batch (5 cancel + 5 deadline expired).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0013ms |
| p50 | 0.0013ms |
| p95 | 0.0019ms |
| p99 | 0.0048ms |
| mean | 0.0015ms |
| stdev | 0.00095ms |
| min | 0.0013ms |
| max | 0.0055ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0013ms | 0.0013ms | +0.000041ms | +3.28% |
| p50 | 0.0013ms | 0.0013ms | 0.00ms | 0.00% |
| p95 | 0.0019ms | 0.0052ms | -0.0033ms | -64.18% |
| p99 | 0.0048ms | 0.0062ms | -0.0014ms | -22.56% |
| mean | 0.0015ms | 0.0017ms | -0.00020ms | -11.57% |
| min | 0.0013ms | 0.0013ms | +0.000041ms | +3.28% |
| max | 0.0055ms | 0.0065ms | -0.00092ms | -14.20% |
| total | 0.03ms | 0.03ms | -0.0040ms | -11.57% |

