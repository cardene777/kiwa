# Perf Suite — notification

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| sendPush | 0.00042ms | 0.0017ms | 5ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| sendSMS | 0.00042ms | 0.0013ms | 5ms | 0.00034ms | PASS | stable (p10 +2% (閾値未満)、 p95 +31% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| parseNotificationEvent | 0.00033ms | 0.0010ms | 5ms | 0.00034ms | PASS | stable (検知には +0.00034ms (baseline 比 +101%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| sendPush | cpu | 0.08ms | 0.00042ms | 0.005 | 0.005 | 0.00042ms | 0.00038ms |
| sendSMS | cpu | 0.08ms | 0.00042ms | 0.005 | 0.005 | 0.00043ms | 0.00042ms |
| parseNotificationEvent | cpu | 0.08ms | 0.00033ms | 0.004 | 0.004 | 0.00034ms | 0.00033ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| sendPush | 0.01ms | 10ms | PASS |
| sendSMS | 0.01ms | 10ms | PASS |
| parseNotificationEvent | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| sendPush | 196064 B | 0 B | 102400 B | yes | PASS |
| sendSMS | 23096 B | 0 B | 102400 B | yes | PASS |
| parseNotificationEvent | 664 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### sendPush

# Perf Report — sendPush.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.0017ms |
| p99 | 0.0045ms |
| mean | 0.00066ms |
| stdev | 0.00082ms |
| min | 0.00038ms |
| max | 0.0069ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00038ms | +0.000041ms | +10.93% |
| p50 | 0.00046ms | 0.00042ms | +0.000041ms | +9.83% |
| p95 | 0.0017ms | 0.0027ms | -0.0010ms | -37.28% |
| p99 | 0.0045ms | 0.01ms | -0.0076ms | -62.82% |
| mean | 0.00066ms | 0.00091ms | -0.00025ms | -27.17% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.0069ms | 0.02ms | -0.01ms | -67.26% |
| total | 0.13ms | 0.18ms | -0.05ms | -27.17% |

### sendSMS

# Perf Report — sendSMS.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.0013ms |
| p99 | 0.0024ms |
| mean | 0.00060ms |
| stdev | 0.00047ms |
| min | 0.00042ms |
| max | 0.0042ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | +0.0000010ms | +0.24% |
| p50 | 0.00046ms | 0.00046ms | +0.0000010ms | +0.22% |
| p95 | 0.0013ms | 0.0010ms | +0.00029ms | +28.75% |
| p99 | 0.0024ms | 0.0026ms | -0.00029ms | -11.14% |
| mean | 0.00060ms | 0.00062ms | -0.000019ms | -3.12% |
| min | 0.00042ms | 0.00038ms | +0.000041ms | +10.93% |
| max | 0.0042ms | 0.02ms | -0.01ms | -72.85% |
| total | 0.12ms | 0.12ms | -0.0039ms | -3.12% |

### parseNotificationEvent

# Perf Report — parseNotificationEvent.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.0010ms |
| p99 | 0.0067ms |
| mean | 0.00058ms |
| stdev | 0.0012ms |
| min | 0.00033ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| p50 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p95 | 0.0010ms | 0.0013ms | -0.00028ms | -21.43% |
| p99 | 0.0067ms | 0.0086ms | -0.0020ms | -23.04% |
| mean | 0.00058ms | 0.00064ms | -0.000060ms | -9.27% |
| min | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.02ms | -0.0075ms | -38.25% |
| total | 0.12ms | 0.13ms | -0.01ms | -9.27% |

