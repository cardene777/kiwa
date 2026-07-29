# Perf Suite — email

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| sendEmail | 0.00038ms | 0.0013ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| verifyWebhookSignature | 0.0023ms | 0.0079ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| parseDeliveryEvent | 0.00033ms | 0.00067ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| sendEmail | 0.01ms | 10ms | PASS |
| verifyWebhookSignature | 0.04ms | 10ms | PASS |
| parseDeliveryEvent | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| sendEmail | -16312 B | 0 B | 102400 B | yes | PASS |
| verifyWebhookSignature | -29568 B | 0 B | 102400 B | yes | PASS |
| parseDeliveryEvent | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### sendEmail

# Perf Report — sendEmail.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.0013ms |
| p99 | 0.0063ms |
| mean | 0.00069ms |
| stdev | 0.0013ms |
| min | 0.00033ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00046ms | -0.000083ms | -18.12% |
| p50 | 0.00042ms | 0.00046ms | -0.000042ms | -9.15% |
| p95 | 0.0013ms | 0.0018ms | -0.00050ms | -27.67% |
| p99 | 0.0063ms | 0.0059ms | +0.00038ms | +6.54% |
| mean | 0.00069ms | 0.00073ms | -0.000044ms | -5.97% |
| min | 0.00033ms | 0.00042ms | -0.000083ms | -19.95% |
| max | 0.01ms | 0.02ms | -0.0044ms | -26.78% |
| total | 0.14ms | 0.15ms | -0.0087ms | -5.97% |

### verifyWebhookSignature

# Perf Report — verifyWebhookSignature.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0023ms |
| p50 | 0.0024ms |
| p95 | 0.0079ms |
| p99 | 0.01ms |
| mean | 0.0034ms |
| stdev | 0.0047ms |
| min | 0.0022ms |
| max | 0.06ms |
| total | 0.67ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0023ms | 0.0025ms | -0.00017ms | -6.79% |
| p50 | 0.0024ms | 0.0072ms | -0.0047ms | -66.27% |
| p95 | 0.0079ms | 0.02ms | -0.01ms | -57.55% |
| p99 | 0.01ms | 0.07ms | -0.06ms | -80.21% |
| mean | 0.0034ms | 0.0090ms | -0.0057ms | -62.78% |
| min | 0.0022ms | 0.0024ms | -0.00021ms | -8.76% |
| max | 0.06ms | 0.15ms | -0.09ms | -59.86% |
| total | 0.67ms | 1.80ms | -1.13ms | -62.78% |

### parseDeliveryEvent

# Perf Report — parseDeliveryEvent.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.00067ms |
| p99 | 0.0038ms |
| mean | 0.00052ms |
| stdev | 0.00081ms |
| min | 0.00033ms |
| max | 0.0089ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00038ms | -0.000041ms | -10.93% |
| p50 | 0.00038ms | 0.00042ms | -0.000042ms | -10.07% |
| p95 | 0.00067ms | 0.00096ms | -0.00030ms | -30.75% |
| p99 | 0.0038ms | 0.0039ms | -0.000079ms | -2.03% |
| mean | 0.00052ms | 0.00062ms | -0.00011ms | -17.01% |
| min | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| max | 0.0089ms | 0.02ms | -0.0077ms | -46.24% |
| total | 0.10ms | 0.12ms | -0.02ms | -17.01% |

