# Perf Suite — upload-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00058ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 0.02ms | 0.04ms | 100ms | 0.0011ms | PASS | stable — gate 無効 (regressionGate=false) |
| presigned_batch (5 presigned URL PUT/GET across providers) | 0.0099ms | 0.10ms | 100ms | 0.0011ms | PASS | stable (換算後 p10 -2% (閾値未満)、 p95 +430% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| size_error_handling (5 oversize + checksum verify) | 0.0084ms | 0.02ms | 100ms | 0.0011ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | cpu | 0.09ms | 0.09ms | 0.02ms | 0.243 | 0.253 | n/a | 20.0% | 0.02ms | 0.02ms |
| presigned_batch (5 presigned URL PUT/GET across providers) | cpu | 0.09ms | 0.22ms | 0.0099ms | 0.112 | 0.114 | n/a | 20.0% | 0.0092ms | 0.0093ms |
| size_error_handling (5 oversize + checksum verify) | cpu | 0.09ms | 0.09ms | 0.0084ms | 0.097 | 0.103 | n/a | 20.0% | 0.0080ms | 0.0084ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 1.90ms | 200ms | PASS |
| presigned_batch (5 presigned URL PUT/GET across providers) | 0.06ms | 200ms | PASS |
| size_error_handling (5 oversize + checksum verify) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 30824 B | -27027 B | 102400 B | yes | 23 (3 + 20) | PASS |
| presigned_batch (5 presigned URL PUT/GET across providers) | -5288 B | 8192 B | 102400 B | yes | 23 (3 + 20) | PASS |
| size_error_handling (5 oversize + checksum verify) | 312 B | -174640 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### upload_workflow (10 upload across 4 providers + multipart)

# Perf Report — upload_workflow (10 upload across 4 providers + multipart).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0054ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.55ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.909)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00077ms | -3.74% |
| p50 | 0.02ms | 0.02ms | +0.00068ms | +2.83% |
| p95 | 0.03ms | 0.03ms | +0.0013ms | +3.95% |
| p99 | 0.03ms | 0.03ms | +0.00032ms | +0.95% |
| mean | 0.02ms | 0.03ms | -0.00021ms | -0.82% |
| min | 0.02ms | 0.02ms | -0.00078ms | -3.83% |
| max | 0.03ms | 0.03ms | +0.000078ms | +0.23% |
| total | 0.50ms | 0.50ms | -0.0041ms | -0.82% |

### presigned_batch (5 presigned URL PUT/GET across providers)

# Perf Report — presigned_batch (5 presigned URL PUT/GET across providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0099ms |
| p50 | 0.01ms |
| p95 | 0.10ms |
| p99 | 0.44ms |
| mean | 0.04ms |
| stdev | 0.11ms |
| min | 0.0097ms |
| max | 0.52ms |
| total | 0.86ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.922)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0092ms | 0.0093ms | -0.00017ms | -1.80% |
| p50 | 0.0098ms | 0.0096ms | +0.00027ms | +2.80% |
| p95 | 0.09ms | 0.02ms | +0.08ms | +429.51% |
| p99 | 0.40ms | 0.02ms | +0.39ms | +2159.18% |
| mean | 0.04ms | 0.01ms | +0.03ms | +269.27% |
| min | 0.0090ms | 0.0092ms | -0.00022ms | -2.42% |
| max | 0.48ms | 0.02ms | +0.46ms | +2584.90% |
| total | 0.80ms | 0.22ms | +0.58ms | +269.27% |

### size_error_handling (5 oversize + checksum verify)

# Perf Report — size_error_handling (5 oversize + checksum verify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0084ms |
| p50 | 0.0088ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0032ms |
| min | 0.0083ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.947)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0080ms | 0.0084ms | -0.00045ms | -5.30% |
| p50 | 0.0083ms | 0.0092ms | -0.00084ms | -9.17% |
| p95 | 0.02ms | 0.03ms | -0.01ms | -44.90% |
| p99 | 0.02ms | 0.04ms | -0.02ms | -56.75% |
| mean | 0.0097ms | 0.01ms | -0.0028ms | -22.60% |
| min | 0.0079ms | 0.0083ms | -0.00048ms | -5.78% |
| max | 0.02ms | 0.04ms | -0.03ms | -58.93% |
| total | 0.19ms | 0.25ms | -0.06ms | -22.60% |

