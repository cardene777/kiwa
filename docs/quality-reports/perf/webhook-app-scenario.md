# Perf Suite — webhook-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | 0.05ms | 0.07ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| dispatch_retry_batch (5 handler retry with backoff) | 0.02ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| signature_reject_error (5 invalid signature detect) | 0.0047ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | cpu | 0.08ms | 0.05ms | 0.625 | 0.672 | 0.05ms | 0.06ms |
| dispatch_retry_batch (5 handler retry with backoff) | cpu | 0.08ms | 0.02ms | 0.192 | 0.192 | 0.02ms | 0.02ms |
| signature_reject_error (5 invalid signature detect) | cpu | 0.08ms | 0.0047ms | 0.057 | 0.055 | 0.0047ms | 0.0046ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | 0.21ms | 200ms | PASS |
| dispatch_retry_batch (5 handler retry with backoff) | 0.08ms | 200ms | PASS |
| signature_reject_error (5 invalid signature detect) | 0.02ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | -10136 B | 0 B | 102400 B | yes | PASS |
| dispatch_retry_batch (5 handler retry with backoff) | 1240 B | 0 B | 102400 B | yes | PASS |
| signature_reject_error (5 invalid signature detect) | 808 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### verify_workflow (10 verify across 4 providers)

# Perf Report — verify_workflow (10 verify across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.06ms |
| p95 | 0.07ms |
| p99 | 0.09ms |
| mean | 0.06ms |
| stdev | 0.0092ms |
| min | 0.05ms |
| max | 0.09ms |
| total | 1.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.06ms | -0.0049ms | -8.69% |
| p50 | 0.06ms | 0.06ms | -0.0017ms | -2.86% |
| p95 | 0.07ms | 0.09ms | -0.01ms | -13.74% |
| p99 | 0.09ms | 0.14ms | -0.05ms | -37.66% |
| mean | 0.06ms | 0.07ms | -0.0063ms | -9.40% |
| min | 0.05ms | 0.05ms | -0.0018ms | -3.45% |
| max | 0.09ms | 0.16ms | -0.06ms | -40.99% |
| total | 1.22ms | 1.35ms | -0.13ms | -9.40% |

### dispatch_retry_batch (5 handler retry with backoff)

# Perf Report — dispatch_retry_batch (5 handler retry with backoff).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0038ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00036ms | -2.32% |
| p50 | 0.02ms | 0.02ms | -0.0012ms | -7.19% |
| p95 | 0.02ms | 0.03ms | -0.0076ms | -26.10% |
| p99 | 0.03ms | 0.03ms | -0.0022ms | -6.67% |
| mean | 0.02ms | 0.02ms | -0.0015ms | -8.26% |
| min | 0.02ms | 0.02ms | -0.00021ms | -1.36% |
| max | 0.03ms | 0.03ms | -0.00079ms | -2.39% |
| total | 0.34ms | 0.37ms | -0.03ms | -8.26% |

### signature_reject_error (5 invalid signature detect)

# Perf Report — signature_reject_error (5 invalid signature detect).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0047ms |
| p50 | 0.0052ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0061ms |
| stdev | 0.0023ms |
| min | 0.0045ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0047ms | 0.0046ms | +0.000086ms | +1.89% |
| p50 | 0.0052ms | 0.0065ms | -0.0012ms | -18.97% |
| p95 | 0.01ms | 0.02ms | -0.01ms | -53.42% |
| p99 | 0.01ms | 0.03ms | -0.01ms | -48.37% |
| mean | 0.0061ms | 0.0085ms | -0.0024ms | -28.44% |
| min | 0.0045ms | 0.0044ms | +0.000084ms | +1.90% |
| max | 0.01ms | 0.03ms | -0.01ms | -47.32% |
| total | 0.12ms | 0.17ms | -0.05ms | -28.44% |

