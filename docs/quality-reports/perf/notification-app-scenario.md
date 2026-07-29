# Perf Suite — notification-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | 0.0060ms | 0.01ms | 100ms | 0.00043ms | PASS | stable — gate 無効 (regressionGate=false) |
| push_batch (5 sendPush with high-priority payload) | 0.0015ms | 0.0026ms | 100ms | 0.00043ms | PASS | stable (p10 +5% (閾値未満)、 p95 +31% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| sms_error_handling (5 failOn callback path) | 0.0014ms | 0.0017ms | 100ms | 0.00045ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | cpu | 0.08ms | 0.0060ms | 0.076 | 0.085 | 0.0062ms | 0.0070ms |
| push_batch (5 sendPush with high-priority payload) | cpu | 0.08ms | 0.0015ms | 0.019 | 0.018 | 0.0016ms | 0.0015ms |
| sms_error_handling (5 failOn callback path) | cpu | 0.08ms | 0.0014ms | 0.017 | 0.016 | 0.0015ms | 0.0015ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | 0.02ms | 200ms | PASS |
| push_batch (5 sendPush with high-priority payload) | 0.01ms | 200ms | PASS |
| sms_error_handling (5 failOn callback path) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | -3576 B | 0 B | 102400 B | yes | PASS |
| push_batch (5 sendPush with high-priority payload) | 344 B | 0 B | 102400 B | yes | PASS |
| sms_error_handling (5 failOn callback path) | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_channel_workflow (10 dispatch push+sms+in-app across providers)

# Perf Report — multi_channel_workflow (10 dispatch push+sms+in-app across providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0060ms |
| p50 | 0.0073ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0086ms |
| stdev | 0.0034ms |
| min | 0.0057ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0060ms | 0.0070ms | -0.00097ms | -13.93% |
| p50 | 0.0073ms | 0.0090ms | -0.0016ms | -18.13% |
| p95 | 0.01ms | 0.03ms | -0.02ms | -52.72% |
| p99 | 0.02ms | 0.07ms | -0.05ms | -72.44% |
| mean | 0.0086ms | 0.01ms | -0.0062ms | -41.94% |
| min | 0.0057ms | 0.0054ms | +0.00038ms | +6.98% |
| max | 0.02ms | 0.08ms | -0.06ms | -74.27% |
| total | 0.17ms | 0.30ms | -0.12ms | -41.94% |

### push_batch (5 sendPush with high-priority payload)

# Perf Report — push_batch (5 sendPush with high-priority payload).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0015ms |
| p50 | 0.0017ms |
| p95 | 0.0026ms |
| p99 | 0.0035ms |
| mean | 0.0020ms |
| stdev | 0.00057ms |
| min | 0.0015ms |
| max | 0.0037ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0015ms | 0.0015ms | +0.000037ms | +2.46% |
| p50 | 0.0017ms | 0.0016ms | +0.000084ms | +5.31% |
| p95 | 0.0026ms | 0.0021ms | +0.00057ms | +27.75% |
| p99 | 0.0035ms | 0.0024ms | +0.0010ms | +42.86% |
| mean | 0.0020ms | 0.0017ms | +0.00033ms | +19.85% |
| min | 0.0015ms | 0.0015ms | 0.00ms | 0.00% |
| max | 0.0037ms | 0.0025ms | +0.0012ms | +45.93% |
| total | 0.04ms | 0.03ms | +0.0066ms | +19.85% |

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
| stdev | 0.00021ms |
| min | 0.0014ms |
| max | 0.0023ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0014ms | 0.0015ms | -0.000046ms | -3.16% |
| p50 | 0.0014ms | 0.0015ms | -0.000083ms | -5.53% |
| p95 | 0.0017ms | 0.0024ms | -0.00075ms | -31.17% |
| p99 | 0.0022ms | 0.0030ms | -0.00078ms | -26.26% |
| mean | 0.0015ms | 0.0016ms | -0.00016ms | -9.89% |
| min | 0.0014ms | 0.0015ms | -0.000083ms | -5.69% |
| max | 0.0023ms | 0.0031ms | -0.00079ms | -25.31% |
| total | 0.03ms | 0.03ms | -0.0032ms | -9.89% |

