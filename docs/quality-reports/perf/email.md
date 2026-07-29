# Perf Suite — email

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| sendEmail | 0.00038ms | 0.0016ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| verifyWebhookSignature | 0.0022ms | 0.0071ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| parseDeliveryEvent | 0.00038ms | 0.00092ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| sendEmail | 0.01ms | 10ms | PASS |
| verifyWebhookSignature | 0.03ms | 10ms | PASS |
| parseDeliveryEvent | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| sendEmail | -115736 B | 0 B | 102400 B | yes | PASS |
| verifyWebhookSignature | -29416 B | 0 B | 102400 B | yes | PASS |
| parseDeliveryEvent | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### sendEmail

# Perf Report — sendEmail.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.0016ms |
| p99 | 0.0046ms |
| mean | 0.00065ms |
| stdev | 0.00081ms |
| min | 0.00033ms |
| max | 0.0070ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00046ms | -0.000083ms | -18.12% |
| p50 | 0.00042ms | 0.00046ms | -0.000042ms | -9.15% |
| p95 | 0.0016ms | 0.0018ms | -0.00020ms | -11.38% |
| p99 | 0.0046ms | 0.0059ms | -0.0012ms | -21.11% |
| mean | 0.00065ms | 0.00073ms | -0.000076ms | -10.47% |
| min | 0.00033ms | 0.00042ms | -0.000083ms | -19.95% |
| max | 0.0070ms | 0.02ms | -0.0093ms | -57.14% |
| total | 0.13ms | 0.15ms | -0.02ms | -10.47% |

### verifyWebhookSignature

# Perf Report — verifyWebhookSignature.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0023ms |
| p95 | 0.0071ms |
| p99 | 0.01ms |
| mean | 0.0029ms |
| stdev | 0.0019ms |
| min | 0.0022ms |
| max | 0.01ms |
| total | 0.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0025ms | -0.00025ms | -10.17% |
| p50 | 0.0023ms | 0.0072ms | -0.0049ms | -68.02% |
| p95 | 0.0071ms | 0.02ms | -0.01ms | -61.59% |
| p99 | 0.01ms | 0.07ms | -0.06ms | -83.77% |
| mean | 0.0029ms | 0.0090ms | -0.0061ms | -67.76% |
| min | 0.0022ms | 0.0024ms | -0.00021ms | -8.80% |
| max | 0.01ms | 0.15ms | -0.14ms | -91.31% |
| total | 0.58ms | 1.80ms | -1.22ms | -67.76% |

### parseDeliveryEvent

# Perf Report — parseDeliveryEvent.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00038ms |
| p95 | 0.00092ms |
| p99 | 0.0037ms |
| mean | 0.00053ms |
| stdev | 0.00082ms |
| min | 0.00033ms |
| max | 0.0083ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p50 | 0.00038ms | 0.00042ms | -0.000042ms | -10.07% |
| p95 | 0.00092ms | 0.00096ms | -0.000044ms | -4.58% |
| p99 | 0.0037ms | 0.0039ms | -0.00015ms | -3.87% |
| mean | 0.00053ms | 0.00062ms | -0.000094ms | -15.13% |
| min | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| max | 0.0083ms | 0.02ms | -0.0083ms | -50.00% |
| total | 0.11ms | 0.12ms | -0.02ms | -15.13% |

