# Perf Suite — email

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| sendEmail | 0.00042ms | 0.0013ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| verifyWebhookSignature | 0.0024ms | 0.0083ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| parseDeliveryEvent | 0.00038ms | 0.00075ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| sendEmail | 0.01ms | 10ms | PASS |
| verifyWebhookSignature | 0.04ms | 10ms | PASS |
| parseDeliveryEvent | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| sendEmail | -126976 B | 0 B | 102400 B | yes | PASS |
| verifyWebhookSignature | 15648 B | -49152 B | 102400 B | yes | PASS |
| parseDeliveryEvent | -4744 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### sendEmail

# Perf Report — sendEmail.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.0013ms |
| p99 | 0.0040ms |
| mean | 0.00058ms |
| stdev | 0.00069ms |
| min | 0.00042ms |
| max | 0.0066ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00046ms | -0.000041ms | -8.95% |
| p50 | 0.00046ms | 0.00046ms | -0.0000010ms | -0.22% |
| p95 | 0.0013ms | 0.0018ms | -0.00050ms | -27.72% |
| p99 | 0.0040ms | 0.0059ms | -0.0019ms | -32.32% |
| mean | 0.00058ms | 0.00073ms | -0.00015ms | -19.88% |
| min | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| max | 0.0066ms | 0.02ms | -0.0097ms | -59.44% |
| total | 0.12ms | 0.15ms | -0.03ms | -19.88% |

### verifyWebhookSignature

# Perf Report — verifyWebhookSignature.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0024ms |
| p50 | 0.0027ms |
| p95 | 0.0083ms |
| p99 | 0.01ms |
| mean | 0.0033ms |
| stdev | 0.0022ms |
| min | 0.0022ms |
| max | 0.02ms |
| total | 0.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0024ms | 0.0025ms | -0.000083ms | -3.38% |
| p50 | 0.0027ms | 0.0072ms | -0.0045ms | -62.20% |
| p95 | 0.0083ms | 0.02ms | -0.01ms | -55.17% |
| p99 | 0.01ms | 0.07ms | -0.06ms | -80.63% |
| mean | 0.0033ms | 0.0090ms | -0.0057ms | -63.51% |
| min | 0.0022ms | 0.0024ms | -0.00013ms | -5.26% |
| max | 0.02ms | 0.15ms | -0.14ms | -89.21% |
| total | 0.66ms | 1.80ms | -1.14ms | -63.51% |

### parseDeliveryEvent

# Perf Report — parseDeliveryEvent.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00075ms |
| p99 | 0.0043ms |
| mean | 0.00057ms |
| stdev | 0.00091ms |
| min | 0.00038ms |
| max | 0.0093ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p50 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p95 | 0.00075ms | 0.00096ms | -0.00021ms | -21.70% |
| p99 | 0.0043ms | 0.0039ms | +0.00043ms | +11.16% |
| mean | 0.00057ms | 0.00062ms | -0.000047ms | -7.49% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.0093ms | 0.02ms | -0.0073ms | -43.72% |
| total | 0.11ms | 0.12ms | -0.0093ms | -7.49% |

