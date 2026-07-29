# Perf Suite — notification

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| sendPush | 0.00046ms | 0.0012ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| sendSMS | 0.00042ms | 0.00054ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| parseNotificationEvent | 0.00042ms | 0.00080ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| sendPush | 0.01ms | 10ms | PASS |
| sendSMS | 0.01ms | 10ms | PASS |
| parseNotificationEvent | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| sendPush | -107688 B | 0 B | 102400 B | yes | PASS |
| sendSMS | 21936 B | 0 B | 102400 B | yes | PASS |
| parseNotificationEvent | 97168 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### sendPush

# Perf Report — sendPush.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.0012ms |
| p99 | 0.0054ms |
| mean | 0.00066ms |
| stdev | 0.00073ms |
| min | 0.00042ms |
| max | 0.0065ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| p50 | 0.00050ms | 0.00063ms | -0.00013ms | -20.00% |
| p95 | 0.0012ms | 0.0013ms | -0.000038ms | -3.02% |
| p99 | 0.0054ms | 0.0058ms | -0.00038ms | -6.57% |
| mean | 0.00066ms | 0.00077ms | -0.00012ms | -15.30% |
| min | 0.00042ms | 0.00050ms | -0.000084ms | -16.80% |
| max | 0.0065ms | 0.0077ms | -0.0012ms | -15.60% |
| total | 0.13ms | 0.15ms | -0.02ms | -15.30% |

### sendSMS

# Perf Report — sendSMS.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.00054ms |
| p99 | 0.0021ms |
| mean | 0.00051ms |
| stdev | 0.00049ms |
| min | 0.00042ms |
| max | 0.0068ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p50 | 0.00046ms | 0.00046ms | -0.0000010ms | -0.22% |
| p95 | 0.00054ms | 0.00071ms | -0.00017ms | -23.90% |
| p99 | 0.0021ms | 0.0023ms | -0.00021ms | -9.13% |
| mean | 0.00051ms | 0.00055ms | -0.000037ms | -6.71% |
| min | 0.00042ms | 0.00038ms | +0.000041ms | +10.93% |
| max | 0.0068ms | 0.0064ms | +0.00038ms | +5.84% |
| total | 0.10ms | 0.11ms | -0.0074ms | -6.71% |

### parseNotificationEvent

# Perf Report — parseNotificationEvent.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00042ms |
| p95 | 0.00080ms |
| p99 | 0.0056ms |
| mean | 0.00062ms |
| stdev | 0.00099ms |
| min | 0.00038ms |
| max | 0.0097ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00046ms | -0.000042ms | -9.17% |
| p50 | 0.00042ms | 0.00046ms | -0.000042ms | -9.15% |
| p95 | 0.00080ms | 0.0012ms | -0.00042ms | -34.31% |
| p99 | 0.0056ms | 0.0046ms | +0.0010ms | +22.84% |
| mean | 0.00062ms | 0.00067ms | -0.000046ms | -6.96% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.0097ms | 0.01ms | -0.0022ms | -18.25% |
| total | 0.12ms | 0.13ms | -0.0093ms | -6.96% |

