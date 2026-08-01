# Perf Suite — webhook-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00058ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | 0.06ms | 0.08ms | 100ms | 0.0010ms | PASS | stable — gate 無効 (regressionGate=false) |
| dispatch_retry_batch (5 handler retry with backoff) | 0.02ms | 0.03ms | 100ms | 0.0010ms | PASS | stable — gate 無効 (regressionGate=false) |
| signature_reject_error (5 invalid signature detect) | 0.0053ms | 0.01ms | 100ms | 0.0010ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | cpu | 0.09ms | 0.10ms | 0.06ms | 0.622 | 0.630 | n/a | 20.0% | 0.05ms | 0.05ms |
| dispatch_retry_batch (5 handler retry with backoff) | cpu | 0.09ms | 0.10ms | 0.02ms | 0.186 | 0.193 | n/a | 20.0% | 0.01ms | 0.02ms |
| signature_reject_error (5 invalid signature detect) | cpu | 0.09ms | 0.11ms | 0.0053ms | 0.057 | 0.055 | n/a | 20.0% | 0.0046ms | 0.0045ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | 0.25ms | 200ms | PASS |
| dispatch_retry_batch (5 handler retry with backoff) | 0.08ms | 200ms | PASS |
| signature_reject_error (5 invalid signature detect) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | -9272 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| dispatch_retry_batch (5 handler retry with backoff) | 6264 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| signature_reject_error (5 invalid signature detect) | 6064 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### verify_workflow (10 verify across 4 providers)

# Perf Report — verify_workflow (10 verify across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.06ms |
| p50 | 0.07ms |
| p95 | 0.08ms |
| p99 | 0.08ms |
| mean | 0.07ms |
| stdev | 0.0067ms |
| min | 0.06ms |
| max | 0.08ms |
| total | 1.35ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.888)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.00067ms | -1.28% |
| p50 | 0.06ms | 0.06ms | +0.00058ms | +0.99% |
| p95 | 0.07ms | 0.07ms | +0.0028ms | +4.10% |
| p99 | 0.07ms | 0.08ms | -0.0054ms | -6.87% |
| mean | 0.06ms | 0.06ms | +0.00013ms | +0.22% |
| min | 0.05ms | 0.05ms | +0.00043ms | +0.84% |
| max | 0.07ms | 0.08ms | -0.0074ms | -9.19% |
| total | 1.20ms | 1.19ms | +0.0027ms | +0.22% |

### dispatch_retry_batch (5 handler retry with backoff)

# Perf Report — dispatch_retry_batch (5 handler retry with backoff).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0046ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.39ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.891)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.00055ms | -3.58% |
| p50 | 0.02ms | 0.02ms | -0.00025ms | -1.59% |
| p95 | 0.02ms | 0.02ms | +0.0020ms | +8.71% |
| p99 | 0.03ms | 0.03ms | -0.0026ms | -8.19% |
| mean | 0.02ms | 0.02ms | -0.000013ms | -0.08% |
| min | 0.01ms | 0.02ms | -0.00058ms | -3.81% |
| max | 0.03ms | 0.03ms | -0.0038ms | -10.96% |
| total | 0.35ms | 0.35ms | -0.00026ms | -0.08% |

### signature_reject_error (5 invalid signature detect)

# Perf Report — signature_reject_error (5 invalid signature detect).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0053ms |
| p50 | 0.0064ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0080ms |
| stdev | 0.0052ms |
| min | 0.0052ms |
| max | 0.03ms |
| total | 0.16ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.871)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0046ms | 0.0045ms | +0.00014ms | +3.09% |
| p50 | 0.0056ms | 0.0058ms | -0.00021ms | -3.53% |
| p95 | 0.01ms | 0.02ms | -0.0037ms | -24.37% |
| p99 | 0.02ms | 0.02ms | +0.0039ms | +21.64% |
| mean | 0.0070ms | 0.0070ms | +0.000013ms | +0.19% |
| min | 0.0045ms | 0.0044ms | +0.00013ms | +2.86% |
| max | 0.02ms | 0.02ms | +0.0059ms | +30.93% |
| total | 0.14ms | 0.14ms | +0.00026ms | +0.19% |

