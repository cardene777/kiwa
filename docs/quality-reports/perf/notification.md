# Perf Suite — notification

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| sendPush | 0.00046ms | 0.0010ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| sendSMS | 0.00038ms | 0.00059ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| parseNotificationEvent | 0.00033ms | 0.0014ms | 5ms | 0.00033ms | PASS | stable (差 0.00013ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| sendPush | 0.01ms | 10ms | PASS |
| sendSMS | 0.01ms | 10ms | PASS |
| parseNotificationEvent | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| sendPush | -104760 B | 0 B | 102400 B | yes | PASS |
| sendSMS | 23416 B | 0 B | 102400 B | yes | PASS |
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
| p95 | 0.0010ms |
| p99 | 0.0049ms |
| mean | 0.00065ms |
| stdev | 0.00072ms |
| min | 0.00042ms |
| max | 0.0064ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| p50 | 0.00050ms | 0.00063ms | -0.00013ms | -20.00% |
| p95 | 0.0010ms | 0.0013ms | -0.00024ms | -18.80% |
| p99 | 0.0049ms | 0.0058ms | -0.00087ms | -15.14% |
| mean | 0.00065ms | 0.00077ms | -0.00013ms | -16.33% |
| min | 0.00042ms | 0.00050ms | -0.000084ms | -16.80% |
| max | 0.0064ms | 0.0077ms | -0.0014ms | -17.74% |
| total | 0.13ms | 0.15ms | -0.03ms | -16.33% |

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
| stdev | 0.00042ms |
| min | 0.00038ms |
| max | 0.0055ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00042ms | -0.000042ms | -10.07% |
| p50 | 0.00042ms | 0.00046ms | -0.000042ms | -9.15% |
| p95 | 0.00059ms | 0.00071ms | -0.00013ms | -17.85% |
| p99 | 0.0020ms | 0.0023ms | -0.00025ms | -10.79% |
| mean | 0.00048ms | 0.00055ms | -0.000072ms | -13.04% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.0055ms | 0.0064ms | -0.00096ms | -14.94% |
| total | 0.10ms | 0.11ms | -0.01ms | -13.04% |

### parseNotificationEvent

# Perf Report — parseNotificationEvent.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00042ms |
| p95 | 0.0014ms |
| p99 | 0.0057ms |
| mean | 0.00058ms |
| stdev | 0.00095ms |
| min | 0.00029ms |
| max | 0.0087ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00046ms | -0.00013ms | -27.29% |
| p50 | 0.00042ms | 0.00046ms | -0.000043ms | -9.37% |
| p95 | 0.0014ms | 0.0012ms | +0.00017ms | +14.15% |
| p99 | 0.0057ms | 0.0046ms | +0.0012ms | +25.73% |
| mean | 0.00058ms | 0.00067ms | -0.000083ms | -12.48% |
| min | 0.00029ms | 0.00042ms | -0.00012ms | -29.81% |
| max | 0.0087ms | 0.01ms | -0.0032ms | -26.67% |
| total | 0.12ms | 0.13ms | -0.02ms | -12.48% |

