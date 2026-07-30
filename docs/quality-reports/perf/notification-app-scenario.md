# Perf Suite — notification-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | 0.0076ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| push_batch (5 sendPush with high-priority payload) | 0.0015ms | 0.0021ms | 100ms | 0.00051ms | PASS | stable — gate 無効 (regressionGate=false) |
| sms_error_handling (5 failOn callback path) | 0.0014ms | 0.0017ms | 100ms | 0.00051ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | cpu | 0.08ms | 0.10ms | 0.0076ms | 0.091 | 0.083 | 0.0075ms | 0.0069ms |
| push_batch (5 sendPush with high-priority payload) | cpu | 0.08ms | 0.09ms | 0.0015ms | 0.018 | 0.019 | 0.0015ms | 0.0015ms |
| sms_error_handling (5 failOn callback path) | cpu | 0.08ms | 0.08ms | 0.0014ms | 0.017 | 0.016 | 0.0014ms | 0.0014ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | 0.04ms | 200ms | PASS |
| push_batch (5 sendPush with high-priority payload) | 0.02ms | 200ms | PASS |
| sms_error_handling (5 failOn callback path) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | -8520 B | 0 B | 102400 B | yes | PASS |
| push_batch (5 sendPush with high-priority payload) | -56 B | 0 B | 102400 B | yes | PASS |
| sms_error_handling (5 failOn callback path) | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_channel_workflow (10 dispatch push+sms+in-app across providers)

# Perf Report — multi_channel_workflow (10 dispatch push+sms+in-app across providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0076ms |
| p50 | 0.0080ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0044ms |
| min | 0.0062ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.997)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0075ms | 0.0069ms | +0.00064ms | +9.27% |
| p50 | 0.0080ms | 0.0076ms | +0.00037ms | +4.83% |
| p95 | 0.02ms | 0.02ms | -0.0023ms | -10.13% |
| p99 | 0.02ms | 0.02ms | -0.0020ms | -8.35% |
| mean | 0.01ms | 0.01ms | -0.00024ms | -2.38% |
| min | 0.0062ms | 0.0063ms | -0.00015ms | -2.32% |
| max | 0.02ms | 0.02ms | -0.0019ms | -7.92% |
| total | 0.20ms | 0.21ms | -0.0049ms | -2.38% |

### push_batch (5 sendPush with high-priority payload)

# Perf Report — push_batch (5 sendPush with high-priority payload).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0015ms |
| p50 | 0.0015ms |
| p95 | 0.0021ms |
| p99 | 0.0025ms |
| mean | 0.0016ms |
| stdev | 0.00028ms |
| min | 0.0015ms |
| max | 0.0026ms |
| total | 0.03ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.012)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0015ms | 0.0015ms | -0.000024ms | -1.59% |
| p50 | 0.0015ms | 0.0015ms | -0.0000026ms | -0.17% |
| p95 | 0.0021ms | 0.0022ms | -0.00013ms | -5.97% |
| p99 | 0.0025ms | 0.0025ms | -8.5e-7ms | -0.03% |
| mean | 0.0017ms | 0.0017ms | -0.000023ms | -1.38% |
| min | 0.0015ms | 0.0015ms | +0.000018ms | +1.25% |
| max | 0.0026ms | 0.0026ms | +0.000032ms | +1.25% |
| total | 0.03ms | 0.03ms | -0.00047ms | -1.38% |

### sms_error_handling (5 failOn callback path)

# Perf Report — sms_error_handling (5 failOn callback path).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0014ms |
| p50 | 0.0014ms |
| p95 | 0.0017ms |
| p99 | 0.0022ms |
| mean | 0.0015ms |
| stdev | 0.00022ms |
| min | 0.0013ms |
| max | 0.0024ms |
| total | 0.03ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.020)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0014ms | 0.0014ms | +0.000028ms | +2.04% |
| p50 | 0.0014ms | 0.0015ms | -0.000054ms | -3.60% |
| p95 | 0.0017ms | 0.0018ms | -0.00013ms | -7.33% |
| p99 | 0.0023ms | 0.0024ms | -0.00015ms | -6.35% |
| mean | 0.0015ms | 0.0016ms | -0.000070ms | -4.38% |
| min | 0.0014ms | 0.0014ms | -0.000015ms | -1.07% |
| max | 0.0024ms | 0.0026ms | -0.00016ms | -6.17% |
| total | 0.03ms | 0.03ms | -0.0014ms | -4.38% |

