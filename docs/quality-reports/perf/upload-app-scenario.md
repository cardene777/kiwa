# Perf Suite — upload-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00029ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00058ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 0.02ms | 0.04ms | 100ms | 0.00051ms | PASS | stable — gate 無効 (regressionGate=false) |
| presigned_batch (5 presigned URL PUT/GET across providers) | 0.01ms | 0.02ms | 100ms | 0.00053ms | PASS | stable — gate 無効 (regressionGate=false) |
| size_error_handling (5 oversize + checksum verify) | 0.0094ms | 0.01ms | 100ms | 0.00053ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | cpu | 0.09ms | 0.10ms | 0.02ms | 0.254 | 0.253 | 0.02ms | 0.02ms |
| presigned_batch (5 presigned URL PUT/GET across providers) | cpu | 0.09ms | 0.09ms | 0.01ms | 0.118 | 0.114 | 0.0097ms | 0.0093ms |
| size_error_handling (5 oversize + checksum verify) | cpu | 0.09ms | 0.09ms | 0.0094ms | 0.104 | 0.103 | 0.0086ms | 0.0084ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 0.13ms | 200ms | PASS |
| presigned_batch (5 presigned URL PUT/GET across providers) | 0.05ms | 200ms | PASS |
| size_error_handling (5 oversize + checksum verify) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 40784 B | -19403 B | 102400 B | yes | PASS |
| presigned_batch (5 presigned URL PUT/GET across providers) | 584 B | -8192 B | 102400 B | yes | PASS |
| size_error_handling (5 oversize + checksum verify) | 88 B | 0 B | 102400 B | yes | PASS |

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
| stdev | 0.0063ms |
| min | 0.02ms |
| max | 0.05ms |
| total | 0.60ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.870)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.000061ms | +0.30% |
| p50 | 0.02ms | 0.02ms | +0.00076ms | +3.15% |
| p95 | 0.04ms | 0.03ms | +0.0029ms | +9.02% |
| p99 | 0.04ms | 0.03ms | +0.0057ms | +17.19% |
| mean | 0.03ms | 0.03ms | +0.0011ms | +4.28% |
| min | 0.02ms | 0.02ms | +0.00012ms | +0.60% |
| max | 0.04ms | 0.03ms | +0.0064ms | +19.15% |
| total | 0.52ms | 0.50ms | +0.02ms | +4.28% |

### presigned_batch (5 presigned URL PUT/GET across providers)

# Perf Report — presigned_batch (5 presigned URL PUT/GET across providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0021ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.910)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0097ms | 0.0093ms | +0.00037ms | +3.92% |
| p50 | 0.01ms | 0.0096ms | +0.00044ms | +4.64% |
| p95 | 0.02ms | 0.02ms | -0.0019ms | -10.49% |
| p99 | 0.02ms | 0.02ms | -0.0018ms | -9.82% |
| mean | 0.01ms | 0.01ms | +0.000066ms | +0.62% |
| min | 0.0097ms | 0.0092ms | +0.00046ms | +4.96% |
| max | 0.02ms | 0.02ms | -0.0017ms | -9.66% |
| total | 0.22ms | 0.22ms | +0.0013ms | +0.62% |

### size_error_handling (5 oversize + checksum verify)

# Perf Report — size_error_handling (5 oversize + checksum verify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0094ms |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0026ms |
| min | 0.0093ms |
| max | 0.02ms |
| total | 0.22ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.909)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0086ms | 0.0084ms | +0.00014ms | +1.69% |
| p50 | 0.0092ms | 0.0092ms | +0.000041ms | +0.45% |
| p95 | 0.01ms | 0.03ms | -0.02ms | -60.81% |
| p99 | 0.02ms | 0.04ms | -0.02ms | -56.81% |
| mean | 0.0099ms | 0.01ms | -0.0026ms | -20.81% |
| min | 0.0084ms | 0.0083ms | +0.00012ms | +1.39% |
| max | 0.02ms | 0.04ms | -0.02ms | -56.08% |
| total | 0.20ms | 0.25ms | -0.05ms | -20.81% |

