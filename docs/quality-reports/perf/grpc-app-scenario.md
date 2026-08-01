# Perf Suite — grpc-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00058ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | 0.0052ms | 0.0075ms | 100ms | 0.00097ms | PASS | stable — gate 無効 (regressionGate=false) |
| streaming_batch (5 server-stream + bidi mix) | 0.0074ms | 0.02ms | 100ms | 0.0010ms | PASS | stable — gate 無効 (regressionGate=false) |
| error_status_batch (5 fail method returns INTERNAL) | 0.02ms | 0.03ms | 100ms | 0.00099ms | PASS | stable (換算後 p10 +4% (閾値未満)、 p95 +68% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| interceptor_chain_batch (10 unary through auth+log) | 0.02ms | 0.03ms | 100ms | 0.00082ms | PASS | regressed — gate 無効 (regressionGate=false) |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 0.0015ms | 0.0042ms | 100ms | 0.0012ms | PASS | stable (換算後 p10 +8% (閾値未満)、 p95 +40% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | cpu | 0.10ms | 0.10ms | 0.0052ms | 0.052 | 0.051 | n/a | 20.0% | 0.0044ms | 0.0042ms |
| streaming_batch (5 server-stream + bidi mix) | cpu | 0.09ms | 0.10ms | 0.0074ms | 0.080 | 0.079 | n/a | 20.0% | 0.0066ms | 0.0065ms |
| error_status_batch (5 fail method returns INTERNAL) | cpu | 0.10ms | 0.24ms | 0.02ms | 0.153 | 0.148 | n/a | 20.0% | 0.01ms | 0.01ms |
| interceptor_chain_batch (10 unary through auth+log) | cpu | 0.12ms | 0.12ms | 0.02ms | 0.152 | 0.081 | n/a | 20.0% | 0.01ms | 0.0067ms |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | cpu | 0.09ms | 0.11ms | 0.0015ms | 0.015 | 0.014 | n/a | 20.0% | 0.0015ms | 0.0014ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | 0.04ms | 200ms | PASS |
| streaming_batch (5 server-stream + bidi mix) | 0.05ms | 200ms | PASS |
| error_status_batch (5 fail method returns INTERNAL) | 0.09ms | 200ms | PASS |
| interceptor_chain_batch (10 unary through auth+log) | 0.04ms | 200ms | PASS |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 0.02ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | -13688 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| streaming_batch (5 server-stream + bidi mix) | 2208 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| error_status_batch (5 fail method returns INTERNAL) | -416 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| interceptor_chain_batch (10 unary through auth+log) | 576 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | -144 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### multi_service_workflow (10 invokeUnary across 4 providers)

# Perf Report — multi_service_workflow (10 invokeUnary across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0052ms |
| p50 | 0.0054ms |
| p95 | 0.0075ms |
| p99 | 0.0076ms |
| mean | 0.0057ms |
| stdev | 0.00071ms |
| min | 0.0052ms |
| max | 0.0076ms |
| total | 0.11ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.831)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0044ms | 0.0042ms | +0.00011ms | +2.70% |
| p50 | 0.0045ms | 0.0045ms | -0.000074ms | -1.63% |
| p95 | 0.0062ms | 0.07ms | -0.06ms | -91.08% |
| p99 | 0.0063ms | 0.09ms | -0.08ms | -92.78% |
| mean | 0.0047ms | 0.01ms | -0.0081ms | -63.11% |
| min | 0.0043ms | 0.0041ms | +0.00017ms | +4.12% |
| max | 0.0063ms | 0.09ms | -0.09ms | -93.10% |
| total | 0.09ms | 0.26ms | -0.16ms | -63.11% |

### streaming_batch (5 server-stream + bidi mix)

# Perf Report — streaming_batch (5 server-stream + bidi mix).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0074ms |
| p50 | 0.0078ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0092ms |
| stdev | 0.0040ms |
| min | 0.0072ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.890)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0066ms | 0.0065ms | +0.000062ms | +0.95% |
| p50 | 0.0070ms | 0.0068ms | +0.00014ms | +2.09% |
| p95 | 0.02ms | 0.02ms | -0.0063ms | -25.60% |
| p99 | 0.02ms | 0.03ms | -0.0066ms | -26.26% |
| mean | 0.0082ms | 0.0091ms | -0.00093ms | -10.16% |
| min | 0.0064ms | 0.0065ms | -0.000042ms | -0.65% |
| max | 0.02ms | 0.03ms | -0.0067ms | -26.42% |
| total | 0.16ms | 0.18ms | -0.02ms | -10.16% |

### error_status_batch (5 fail method returns INTERNAL)

# Perf Report — error_status_batch (5 fail method returns INTERNAL).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.09ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.10ms |
| total | 0.43ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.846)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00043ms | +3.52% |
| p50 | 0.01ms | 0.01ms | +0.00060ms | +4.77% |
| p95 | 0.03ms | 0.01ms | +0.01ms | +68.25% |
| p99 | 0.07ms | 0.02ms | +0.06ms | +334.00% |
| mean | 0.02ms | 0.01ms | +0.0051ms | +38.99% |
| min | 0.01ms | 0.01ms | +0.00026ms | +2.13% |
| max | 0.09ms | 0.02ms | +0.07ms | +390.95% |
| total | 0.36ms | 0.26ms | +0.10ms | +38.99% |

### interceptor_chain_batch (10 unary through auth+log)

# Perf Report — interceptor_chain_batch (10 unary through auth+log).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.21ms |
| mean | 0.03ms |
| stdev | 0.05ms |
| min | 0.02ms |
| max | 0.26ms |
| total | 0.63ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.699)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0067ms | +0.0058ms | +86.33% |
| p50 | 0.01ms | 0.0070ms | +0.0062ms | +88.72% |
| p95 | 0.02ms | 0.0088ms | +0.02ms | +178.61% |
| p99 | 0.15ms | 0.02ms | +0.12ms | +520.15% |
| mean | 0.02ms | 0.0081ms | +0.01ms | +170.97% |
| min | 0.01ms | 0.0066ms | +0.0056ms | +83.80% |
| max | 0.18ms | 0.03ms | +0.15ms | +547.00% |
| total | 0.44ms | 0.16ms | +0.28ms | +170.97% |

### cancel_deadline_batch (5 cancel + 5 deadline expired)

# Perf Report — cancel_deadline_batch (5 cancel + 5 deadline expired).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0015ms |
| p50 | 0.0016ms |
| p95 | 0.0042ms |
| p99 | 0.0051ms |
| mean | 0.0021ms |
| stdev | 0.0010ms |
| min | 0.0014ms |
| max | 0.0054ms |
| total | 0.04ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.048)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0015ms | 0.0014ms | +0.00011ms | +7.96% |
| p50 | 0.0017ms | 0.0014ms | +0.00024ms | +17.12% |
| p95 | 0.0044ms | 0.0032ms | +0.0013ms | +40.09% |
| p99 | 0.0054ms | 0.0050ms | +0.00040ms | +7.91% |
| mean | 0.0022ms | 0.0019ms | +0.00027ms | +13.81% |
| min | 0.0015ms | 0.0014ms | +0.00011ms | +7.96% |
| max | 0.0056ms | 0.0055ms | +0.00018ms | +3.24% |
| total | 0.04ms | 0.04ms | +0.0053ms | +13.81% |

