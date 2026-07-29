# Perf Suite — notification

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| sendPush | 0.00046ms | 0.0015ms | 5ms | 0.00033ms | PASS | stable (p10 -8% (閾値未満)、 p95 +20% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| sendSMS | 0.00038ms | 0.00059ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| parseNotificationEvent | 0.00033ms | 0.0016ms | 5ms | 0.00033ms | PASS | stable (差 0.00013ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| sendPush | 0.01ms | 10ms | PASS |
| sendSMS | 0.01ms | 10ms | PASS |
| parseNotificationEvent | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| sendPush | -124480 B | 0 B | 102400 B | yes | PASS |
| sendSMS | 22184 B | 0 B | 102400 B | yes | PASS |
| parseNotificationEvent | 632 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### sendPush

# Perf Report — sendPush.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.0015ms |
| p99 | 0.0050ms |
| mean | 0.00071ms |
| stdev | 0.00088ms |
| min | 0.00046ms |
| max | 0.0075ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| p50 | 0.00050ms | 0.00063ms | -0.00013ms | -20.00% |
| p95 | 0.0015ms | 0.0013ms | +0.00025ms | +20.14% |
| p99 | 0.0050ms | 0.0058ms | -0.00073ms | -12.70% |
| mean | 0.00071ms | 0.00077ms | -0.000066ms | -8.59% |
| min | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| max | 0.0075ms | 0.0077ms | -0.00025ms | -3.23% |
| total | 0.14ms | 0.15ms | -0.01ms | -8.59% |

### sendSMS

# Perf Report — sendSMS.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00059ms |
| p99 | 0.0020ms |
| mean | 0.00048ms |
| stdev | 0.00052ms |
| min | 0.00033ms |
| max | 0.0068ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00042ms | -0.000042ms | -10.07% |
| p50 | 0.00042ms | 0.00046ms | -0.000043ms | -9.37% |
| p95 | 0.00059ms | 0.00071ms | -0.00013ms | -17.71% |
| p99 | 0.0020ms | 0.0023ms | -0.00032ms | -14.03% |
| mean | 0.00048ms | 0.00055ms | -0.000072ms | -13.01% |
| min | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| max | 0.0068ms | 0.0064ms | +0.00037ms | +5.83% |
| total | 0.10ms | 0.11ms | -0.01ms | -13.01% |

### parseNotificationEvent

# Perf Report — parseNotificationEvent.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00042ms |
| p95 | 0.0016ms |
| p99 | 0.0049ms |
| mean | 0.00059ms |
| stdev | 0.00093ms |
| min | 0.00029ms |
| max | 0.0089ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00046ms | -0.00013ms | -27.29% |
| p50 | 0.00042ms | 0.00046ms | -0.000043ms | -9.37% |
| p95 | 0.0016ms | 0.0012ms | +0.00038ms | +30.79% |
| p99 | 0.0049ms | 0.0046ms | +0.00034ms | +7.46% |
| mean | 0.00059ms | 0.00067ms | -0.000081ms | -12.13% |
| min | 0.00029ms | 0.00042ms | -0.00012ms | -29.81% |
| max | 0.0089ms | 0.01ms | -0.0030ms | -24.91% |
| total | 0.12ms | 0.13ms | -0.02ms | -12.13% |

