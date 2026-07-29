# Perf Suite — notification

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| sendPush | 0.00046ms | 0.0018ms | 5ms | 0.00033ms | PASS | stable (p10 -8% (閾値未満)、 p95 +47% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| sendSMS | 0.00042ms | 0.00063ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| parseNotificationEvent | 0.00042ms | 0.0021ms | 5ms | 0.00033ms | PASS | stable (p10 -9% (閾値未満)、 p95 +74% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| sendPush | 0.01ms | 10ms | PASS |
| sendSMS | 0.01ms | 10ms | PASS |
| parseNotificationEvent | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| sendPush | 30712 B | 0 B | 102400 B | yes | PASS |
| sendSMS | 22448 B | 0 B | 102400 B | yes | PASS |
| parseNotificationEvent | 4856 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### sendPush

# Perf Report — sendPush.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00054ms |
| p95 | 0.0018ms |
| p99 | 0.0061ms |
| mean | 0.00081ms |
| stdev | 0.0010ms |
| min | 0.00042ms |
| max | 0.0096ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| p50 | 0.00054ms | 0.00063ms | -0.000084ms | -13.44% |
| p95 | 0.0018ms | 0.0013ms | +0.00059ms | +46.90% |
| p99 | 0.0061ms | 0.0058ms | +0.00038ms | +6.63% |
| mean | 0.00081ms | 0.00077ms | +0.000035ms | +4.48% |
| min | 0.00042ms | 0.00050ms | -0.000084ms | -16.80% |
| max | 0.0096ms | 0.0077ms | +0.0018ms | +23.65% |
| total | 0.16ms | 0.15ms | +0.0069ms | +4.48% |

### sendSMS

# Perf Report — sendSMS.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.00063ms |
| p99 | 0.0022ms |
| mean | 0.00052ms |
| stdev | 0.00051ms |
| min | 0.00033ms |
| max | 0.0068ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | -0.0000010ms | -0.24% |
| p50 | 0.00046ms | 0.00046ms | -0.0000010ms | -0.22% |
| p95 | 0.00063ms | 0.00071ms | -0.000087ms | -12.24% |
| p99 | 0.0022ms | 0.0023ms | -0.00013ms | -5.48% |
| mean | 0.00052ms | 0.00055ms | -0.000033ms | -6.01% |
| min | 0.00033ms | 0.00038ms | -0.000041ms | -10.93% |
| max | 0.0068ms | 0.0064ms | +0.00042ms | +6.48% |
| total | 0.10ms | 0.11ms | -0.0066ms | -6.01% |

### parseNotificationEvent

# Perf Report — parseNotificationEvent.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00042ms |
| p95 | 0.0021ms |
| p99 | 0.0047ms |
| mean | 0.00065ms |
| stdev | 0.0010ms |
| min | 0.00029ms |
| max | 0.01ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00046ms | -0.000042ms | -9.17% |
| p50 | 0.00042ms | 0.00046ms | -0.000042ms | -9.15% |
| p95 | 0.0021ms | 0.0012ms | +0.00090ms | +73.69% |
| p99 | 0.0047ms | 0.0046ms | +0.000095ms | +2.09% |
| mean | 0.00065ms | 0.00067ms | -0.000022ms | -3.37% |
| min | 0.00029ms | 0.00042ms | -0.00012ms | -30.05% |
| max | 0.01ms | 0.01ms | -0.0017ms | -14.74% |
| total | 0.13ms | 0.13ms | -0.0045ms | -3.37% |

