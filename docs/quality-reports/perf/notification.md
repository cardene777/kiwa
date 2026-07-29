# Perf Suite — notification

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| sendPush | 0.00054ms | 0.00090ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| sendSMS | 0.00038ms | 0.00063ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| parseNotificationEvent | 0.00037ms | 0.0015ms | 5ms | 0.00033ms | PASS | stable (p10 -19% (閾値未満)、 p95 +24% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| sendPush | 0.01ms | 10ms | PASS |
| sendSMS | 0.01ms | 10ms | PASS |
| parseNotificationEvent | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| sendPush | -195280 B | 0 B | 102400 B | yes | PASS |
| sendSMS | 22800 B | 0 B | 102400 B | yes | PASS |
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
| p95 | 0.00090ms |
| p99 | 0.0097ms |
| mean | 0.00079ms |
| stdev | 0.0015ms |
| min | 0.00050ms |
| max | 0.01ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00050ms | +0.000041ms | +8.20% |
| p50 | 0.00054ms | 0.00063ms | -0.000083ms | -13.28% |
| p95 | 0.00090ms | 0.0013ms | -0.00035ms | -28.12% |
| p99 | 0.0097ms | 0.0058ms | +0.0039ms | +68.31% |
| mean | 0.00079ms | 0.00077ms | +0.000016ms | +2.13% |
| min | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.0077ms | +0.0072ms | +92.46% |
| total | 0.16ms | 0.15ms | +0.0033ms | +2.13% |

### sendSMS

# Perf Report — sendSMS.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00063ms |
| p99 | 0.0024ms |
| mean | 0.00049ms |
| stdev | 0.00046ms |
| min | 0.00038ms |
| max | 0.0058ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00042ms | -0.000042ms | -10.07% |
| p50 | 0.00042ms | 0.00046ms | -0.000042ms | -9.15% |
| p95 | 0.00063ms | 0.00071ms | -0.000087ms | -12.24% |
| p99 | 0.0024ms | 0.0023ms | +0.00012ms | +5.43% |
| mean | 0.00049ms | 0.00055ms | -0.000057ms | -10.38% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.0058ms | 0.0064ms | -0.00063ms | -9.76% |
| total | 0.10ms | 0.11ms | -0.01ms | -10.38% |

### parseNotificationEvent

# Perf Report — parseNotificationEvent.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00037ms |
| p50 | 0.00042ms |
| p95 | 0.0015ms |
| p99 | 0.0048ms |
| mean | 0.00060ms |
| stdev | 0.00093ms |
| min | 0.00033ms |
| max | 0.0095ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00037ms | 0.00046ms | -0.000087ms | -19.02% |
| p50 | 0.00042ms | 0.00046ms | -0.000042ms | -9.15% |
| p95 | 0.0015ms | 0.0012ms | +0.00030ms | +24.36% |
| p99 | 0.0048ms | 0.0046ms | +0.00029ms | +6.44% |
| mean | 0.00060ms | 0.00067ms | -0.000065ms | -9.74% |
| min | 0.00033ms | 0.00042ms | -0.000083ms | -19.95% |
| max | 0.0095ms | 0.01ms | -0.0024ms | -20.35% |
| total | 0.12ms | 0.13ms | -0.01ms | -9.74% |

