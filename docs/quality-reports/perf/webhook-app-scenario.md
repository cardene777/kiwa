# Perf Suite — webhook-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | 0.06ms | 0.11ms | 100ms | 0.00046ms | PASS | stable (換算後 p10 +3% (閾値未満)、 p95 +45% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| dispatch_retry_batch (5 handler retry with backoff) | 0.02ms | 0.02ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| signature_reject_error (5 invalid signature detect) | 0.0051ms | 0.01ms | 100ms | 0.00043ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | cpu | 0.09ms | 0.10ms | 0.06ms | 0.650 | 0.630 | 0.05ms | 0.05ms |
| dispatch_retry_batch (5 handler retry with backoff) | cpu | 0.09ms | 0.10ms | 0.02ms | 0.196 | 0.193 | 0.02ms | 0.02ms |
| signature_reject_error (5 invalid signature detect) | cpu | 0.09ms | 0.09ms | 0.0051ms | 0.054 | 0.055 | 0.0044ms | 0.0045ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | 0.22ms | 200ms | PASS |
| dispatch_retry_batch (5 handler retry with backoff) | 0.09ms | 200ms | PASS |
| signature_reject_error (5 invalid signature detect) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | -2472 B | 0 B | 102400 B | yes | PASS |
| dispatch_retry_batch (5 handler retry with backoff) | 464 B | 0 B | 102400 B | yes | PASS |
| signature_reject_error (5 invalid signature detect) | 424 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### verify_workflow (10 verify across 4 providers)

# Perf Report — verify_workflow (10 verify across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.06ms |
| p50 | 0.06ms |
| p95 | 0.11ms |
| p99 | 0.18ms |
| mean | 0.07ms |
| stdev | 0.03ms |
| min | 0.06ms |
| max | 0.20ms |
| total | 1.45ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.918)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | +0.0016ms | +3.13% |
| p50 | 0.06ms | 0.06ms | -0.00084ms | -1.44% |
| p95 | 0.10ms | 0.07ms | +0.03ms | +44.51% |
| p99 | 0.17ms | 0.08ms | +0.09ms | +115.92% |
| mean | 0.07ms | 0.06ms | +0.0070ms | +11.75% |
| min | 0.05ms | 0.05ms | -7.9e-7ms | -0.00% |
| max | 0.19ms | 0.08ms | +0.11ms | +131.00% |
| total | 1.33ms | 1.19ms | +0.14ms | +11.75% |

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
| stdev | 0.0034ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.40ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.849)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00022ms | +1.42% |
| p50 | 0.02ms | 0.02ms | +0.000067ms | +0.42% |
| p95 | 0.02ms | 0.02ms | -0.0043ms | -18.91% |
| p99 | 0.03ms | 0.03ms | -0.0052ms | -16.36% |
| mean | 0.02ms | 0.02ms | -0.00050ms | -2.85% |
| min | 0.02ms | 0.02ms | +0.000057ms | +0.37% |
| max | 0.03ms | 0.03ms | -0.0055ms | -15.94% |
| total | 0.34ms | 0.35ms | -0.0099ms | -2.85% |

### signature_reject_error (5 invalid signature detect)

# Perf Report — signature_reject_error (5 invalid signature detect).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0051ms |
| p50 | 0.0060ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0069ms |
| stdev | 0.0023ms |
| min | 0.0050ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.869)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0044ms | 0.0045ms | -0.000072ms | -1.61% |
| p50 | 0.0053ms | 0.0058ms | -0.00056ms | -9.63% |
| p95 | 0.01ms | 0.02ms | -0.0052ms | -33.82% |
| p99 | 0.01ms | 0.02ms | -0.0077ms | -41.98% |
| mean | 0.0060ms | 0.0070ms | -0.00094ms | -13.53% |
| min | 0.0044ms | 0.0044ms | +0.0000077ms | +0.18% |
| max | 0.01ms | 0.02ms | -0.0083ms | -43.63% |
| total | 0.12ms | 0.14ms | -0.02ms | -13.53% |

