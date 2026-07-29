# Perf Suite — notification

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| sendPush | 0.00042ms | 0.0022ms | 5ms | 0.00033ms | PASS | stable (p10 -17% (閾値未満)、 p95 +73% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| sendSMS | 0.00038ms | 0.00063ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| parseNotificationEvent | 0.00033ms | 0.0019ms | 5ms | 0.00033ms | PASS | stable (差 0.00012ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| sendPush | 0.01ms | 10ms | PASS |
| sendSMS | 0.01ms | 10ms | PASS |
| parseNotificationEvent | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| sendPush | 31872 B | 0 B | 102400 B | yes | PASS |
| sendSMS | 23360 B | 0 B | 102400 B | yes | PASS |
| parseNotificationEvent | 632 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### sendPush

# Perf Report — sendPush.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00054ms |
| p95 | 0.0022ms |
| p99 | 0.0064ms |
| mean | 0.00084ms |
| stdev | 0.0011ms |
| min | 0.00042ms |
| max | 0.0091ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00050ms | -0.000083ms | -16.60% |
| p50 | 0.00054ms | 0.00063ms | -0.000083ms | -13.28% |
| p95 | 0.0022ms | 0.0013ms | +0.00092ms | +73.24% |
| p99 | 0.0064ms | 0.0058ms | +0.00068ms | +11.83% |
| mean | 0.00084ms | 0.00077ms | +0.000071ms | +9.14% |
| min | 0.00042ms | 0.00050ms | -0.000084ms | -16.80% |
| max | 0.0091ms | 0.0077ms | +0.0013ms | +17.20% |
| total | 0.17ms | 0.15ms | +0.01ms | +9.14% |

### sendSMS

# Perf Report — sendSMS.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00063ms |
| p99 | 0.0022ms |
| mean | 0.00051ms |
| stdev | 0.00057ms |
| min | 0.00038ms |
| max | 0.0076ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00042ms | -0.000042ms | -10.07% |
| p50 | 0.00042ms | 0.00046ms | -0.000042ms | -9.15% |
| p95 | 0.00063ms | 0.00071ms | -0.000083ms | -11.66% |
| p99 | 0.0022ms | 0.0023ms | -0.000076ms | -3.33% |
| mean | 0.00051ms | 0.00055ms | -0.000045ms | -8.21% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.0076ms | 0.0064ms | +0.0012ms | +18.82% |
| total | 0.10ms | 0.11ms | -0.0090ms | -8.21% |

### parseNotificationEvent

# Perf Report — parseNotificationEvent.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00042ms |
| p95 | 0.0019ms |
| p99 | 0.0055ms |
| mean | 0.00062ms |
| stdev | 0.00095ms |
| min | 0.00033ms |
| max | 0.0094ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00046ms | -0.00012ms | -27.07% |
| p50 | 0.00042ms | 0.00046ms | -0.000042ms | -9.15% |
| p95 | 0.0019ms | 0.0012ms | +0.00066ms | +53.78% |
| p99 | 0.0055ms | 0.0046ms | +0.00099ms | +21.83% |
| mean | 0.00062ms | 0.00067ms | -0.000052ms | -7.77% |
| min | 0.00033ms | 0.00042ms | -0.000083ms | -19.95% |
| max | 0.0094ms | 0.01ms | -0.0025ms | -21.05% |
| total | 0.12ms | 0.13ms | -0.01ms | -7.77% |

