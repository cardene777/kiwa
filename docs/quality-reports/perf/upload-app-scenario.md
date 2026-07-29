# Perf Suite — upload-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 0.02ms | 0.04ms | 100ms | 0.00048ms | PASS | stable — gate 無効 (regressionGate=false) |
| presigned_batch (5 presigned URL PUT/GET across providers) | 0.0089ms | 0.01ms | 100ms | 0.00048ms | PASS | stable — gate 無効 (regressionGate=false) |
| size_error_handling (5 oversize + checksum verify) | 0.0080ms | 0.01ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | cpu | 0.08ms | 0.02ms | 0.245 | 0.276 | 0.02ms | 0.02ms |
| presigned_batch (5 presigned URL PUT/GET across providers) | cpu | 0.08ms | 0.0089ms | 0.108 | 0.106 | 0.0087ms | 0.0086ms |
| size_error_handling (5 oversize + checksum verify) | cpu | 0.08ms | 0.0080ms | 0.100 | 0.107 | 0.0080ms | 0.0086ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 0.11ms | 200ms | PASS |
| presigned_batch (5 presigned URL PUT/GET across providers) | 0.05ms | 200ms | PASS |
| size_error_handling (5 oversize + checksum verify) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 11880 B | 0 B | 102400 B | yes | PASS |
| presigned_batch (5 presigned URL PUT/GET across providers) | 680 B | 0 B | 102400 B | yes | PASS |
| size_error_handling (5 oversize + checksum verify) | 216 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### upload_workflow (10 upload across 4 providers + multipart)

# Perf Report — upload_workflow (10 upload across 4 providers + multipart).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.0088ms |
| min | 0.02ms |
| max | 0.06ms |
| total | 0.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0021ms | -9.24% |
| p50 | 0.02ms | 0.03ms | -0.0036ms | -12.77% |
| p95 | 0.04ms | 0.04ms | -0.0038ms | -9.61% |
| p99 | 0.05ms | 0.05ms | +0.0054ms | +11.05% |
| mean | 0.03ms | 0.03ms | -0.0021ms | -7.10% |
| min | 0.02ms | 0.02ms | -0.0013ms | -6.12% |
| max | 0.06ms | 0.05ms | +0.0077ms | +14.96% |
| total | 0.54ms | 0.58ms | -0.04ms | -7.10% |

### presigned_batch (5 presigned URL PUT/GET across providers)

# Perf Report — presigned_batch (5 presigned URL PUT/GET across providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0089ms |
| p50 | 0.0092ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0096ms |
| stdev | 0.0011ms |
| min | 0.0088ms |
| max | 0.01ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0089ms | 0.0086ms | +0.00025ms | +2.90% |
| p50 | 0.0092ms | 0.0089ms | +0.00023ms | +2.56% |
| p95 | 0.01ms | 0.01ms | +0.000073ms | +0.63% |
| p99 | 0.01ms | 0.01ms | +0.0012ms | +9.84% |
| mean | 0.0096ms | 0.0093ms | +0.00026ms | +2.84% |
| min | 0.0088ms | 0.0085ms | +0.00029ms | +3.44% |
| max | 0.01ms | 0.01ms | +0.0015ms | +12.02% |
| total | 0.19ms | 0.19ms | +0.0053ms | +2.84% |

### size_error_handling (5 oversize + checksum verify)

# Perf Report — size_error_handling (5 oversize + checksum verify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0080ms |
| p50 | 0.0086ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0093ms |
| stdev | 0.0021ms |
| min | 0.0080ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0080ms | 0.0086ms | -0.00060ms | -6.99% |
| p50 | 0.0086ms | 0.0091ms | -0.00044ms | -4.83% |
| p95 | 0.01ms | 0.02ms | -0.0069ms | -36.47% |
| p99 | 0.02ms | 0.02ms | -0.0072ms | -30.83% |
| mean | 0.0093ms | 0.01ms | -0.0011ms | -10.94% |
| min | 0.0080ms | 0.0084ms | -0.00038ms | -4.48% |
| max | 0.02ms | 0.02ms | -0.0072ms | -29.74% |
| total | 0.19ms | 0.21ms | -0.02ms | -10.94% |

