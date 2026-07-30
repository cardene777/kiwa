# Perf Suite — notification

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| sendPush | 0.00038ms | 0.0027ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| sendSMS | 0.00042ms | 0.0028ms | 5ms | 0.00033ms | PASS | stable (換算後 p10 -1% (閾値未満)、 p95 +230% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| parseNotificationEvent | 0.00033ms | 0.0023ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| sendPush | cpu | 0.08ms | 0.09ms | 0.00038ms | 0.005 | 0.005 | 0.00037ms | 0.00042ms |
| sendSMS | cpu | 0.08ms | 0.10ms | 0.00042ms | 0.005 | 0.005 | 0.00041ms | 0.00042ms |
| parseNotificationEvent | cpu | 0.08ms | 0.08ms | 0.00033ms | 0.004 | 0.004 | 0.00033ms | 0.00033ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| sendPush | 0.02ms | 10ms | PASS |
| sendSMS | 0.01ms | 10ms | PASS |
| parseNotificationEvent | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| sendPush | 36592 B | 0 B | 102400 B | yes | PASS |
| sendSMS | 23296 B | 0 B | 102400 B | yes | PASS |
| parseNotificationEvent | 4888 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### sendPush

# Perf Report — sendPush.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.0027ms |
| p99 | 0.02ms |
| mean | 0.00092ms |
| stdev | 0.0024ms |
| min | 0.00038ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.987)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00037ms | 0.00042ms | -0.000046ms | -11.00% |
| p50 | 0.00041ms | 0.00046ms | -0.000046ms | -10.11% |
| p95 | 0.0026ms | 0.0036ms | -0.00092ms | -25.93% |
| p99 | 0.02ms | 0.0082ms | +0.0076ms | +92.20% |
| mean | 0.00090ms | 0.00095ms | -0.000041ms | -4.35% |
| min | 0.00037ms | 0.00038ms | -0.0000048ms | -1.27% |
| max | 0.02ms | 0.0097ms | +0.01ms | +126.84% |
| total | 0.18ms | 0.19ms | -0.0082ms | -4.35% |

### sendSMS

# Perf Report — sendSMS.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00050ms |
| p95 | 0.0028ms |
| p99 | 0.01ms |
| mean | 0.00096ms |
| stdev | 0.0019ms |
| min | 0.00042ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.988)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00041ms | 0.00042ms | -0.0000040ms | -0.95% |
| p50 | 0.00049ms | 0.00042ms | +0.000077ms | +18.48% |
| p95 | 0.0028ms | 0.00085ms | +0.0020ms | +229.53% |
| p99 | 0.01ms | 0.0028ms | +0.0092ms | +325.30% |
| mean | 0.00095ms | 0.00057ms | +0.00038ms | +65.86% |
| min | 0.00041ms | 0.00038ms | +0.000036ms | +9.62% |
| max | 0.02ms | 0.01ms | +0.0050ms | +40.17% |
| total | 0.19ms | 0.11ms | +0.08ms | +65.86% |

### parseNotificationEvent

# Perf Report — parseNotificationEvent.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00033ms |
| p95 | 0.0023ms |
| p99 | 0.01ms |
| mean | 0.00078ms |
| stdev | 0.0019ms |
| min | 0.00029ms |
| max | 0.02ms |
| total | 0.16ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.994)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | -0.0000021ms | -0.62% |
| p50 | 0.00033ms | 0.00038ms | -0.000043ms | -11.49% |
| p95 | 0.0023ms | 0.0021ms | +0.00021ms | +10.37% |
| p99 | 0.01ms | 0.01ms | -0.0015ms | -11.93% |
| mean | 0.00078ms | 0.00077ms | +0.000012ms | +1.51% |
| min | 0.00029ms | 0.00029ms | -8.2e-7ms | -0.28% |
| max | 0.02ms | 0.02ms | -0.0011ms | -6.03% |
| total | 0.16ms | 0.15ms | +0.0023ms | +1.51% |

