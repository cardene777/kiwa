# Perf Suite — notification

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| sendPush | 0.00054ms | 0.0013ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| sendSMS | 0.00046ms | 0.00075ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| parseNotificationEvent | 0.00033ms | 0.0016ms | 5ms | 0.00033ms | PASS | stable (差 0.00012ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| sendPush | 0.01ms | 10ms | PASS |
| sendSMS | 0.01ms | 10ms | PASS |
| parseNotificationEvent | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| sendPush | -368576 B | 0 B | 102400 B | yes | PASS |
| sendSMS | 21968 B | 0 B | 102400 B | yes | PASS |
| parseNotificationEvent | 632 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### sendPush

# Perf Report — sendPush.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00054ms |
| p95 | 0.0013ms |
| p99 | 0.0042ms |
| mean | 0.00070ms |
| stdev | 0.00074ms |
| min | 0.00046ms |
| max | 0.0067ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00050ms | +0.000041ms | +8.20% |
| p50 | 0.00054ms | 0.00063ms | -0.000083ms | -13.28% |
| p95 | 0.0013ms | 0.0013ms | +0.000089ms | +7.13% |
| p99 | 0.0042ms | 0.0058ms | -0.0015ms | -26.45% |
| mean | 0.00070ms | 0.00077ms | -0.000070ms | -8.99% |
| min | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| max | 0.0067ms | 0.0077ms | -0.0011ms | -13.97% |
| total | 0.14ms | 0.15ms | -0.01ms | -8.99% |

### sendSMS

# Perf Report — sendSMS.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.00075ms |
| p99 | 0.0026ms |
| mean | 0.00059ms |
| stdev | 0.00067ms |
| min | 0.00042ms |
| max | 0.0092ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00042ms | +0.000041ms | +9.83% |
| p50 | 0.00050ms | 0.00046ms | +0.000041ms | +8.93% |
| p95 | 0.00075ms | 0.00071ms | +0.000042ms | +5.89% |
| p99 | 0.0026ms | 0.0023ms | +0.00029ms | +12.77% |
| mean | 0.00059ms | 0.00055ms | +0.000039ms | +7.08% |
| min | 0.00042ms | 0.00038ms | +0.000041ms | +10.93% |
| max | 0.0092ms | 0.0064ms | +0.0028ms | +43.49% |
| total | 0.12ms | 0.11ms | +0.0078ms | +7.08% |

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
| mean | 0.00061ms |
| stdev | 0.00095ms |
| min | 0.00029ms |
| max | 0.0092ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00046ms | -0.00012ms | -27.07% |
| p50 | 0.00042ms | 0.00046ms | -0.000042ms | -9.15% |
| p95 | 0.0016ms | 0.0012ms | +0.00036ms | +29.43% |
| p99 | 0.0049ms | 0.0046ms | +0.00034ms | +7.48% |
| mean | 0.00061ms | 0.00067ms | -0.000063ms | -9.39% |
| min | 0.00029ms | 0.00042ms | -0.00012ms | -29.81% |
| max | 0.0092ms | 0.01ms | -0.0027ms | -22.45% |
| total | 0.12ms | 0.13ms | -0.01ms | -9.39% |

