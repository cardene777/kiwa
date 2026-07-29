# Perf Suite — email

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| sendEmail | 0.00046ms | 0.0019ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| verifyWebhookSignature | 0.0027ms | 0.02ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| parseDeliveryEvent | 0.00038ms | 0.00080ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| sendEmail | 0.01ms | 10ms | PASS |
| verifyWebhookSignature | 0.04ms | 10ms | PASS |
| parseDeliveryEvent | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| sendEmail | 36320 B | 0 B | 102400 B | yes | PASS |
| verifyWebhookSignature | -28720 B | 0 B | 102400 B | yes | PASS |
| parseDeliveryEvent | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### sendEmail

# Perf Report — sendEmail.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.0019ms |
| p99 | 0.0046ms |
| mean | 0.00072ms |
| stdev | 0.00087ms |
| min | 0.00042ms |
| max | 0.0075ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p50 | 0.00050ms | 0.00046ms | +0.000041ms | +8.93% |
| p95 | 0.0019ms | 0.0018ms | +0.00013ms | +7.32% |
| p99 | 0.0046ms | 0.0059ms | -0.0012ms | -21.03% |
| mean | 0.00072ms | 0.00073ms | -0.000014ms | -1.91% |
| min | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| max | 0.0075ms | 0.02ms | -0.0089ms | -54.34% |
| total | 0.14ms | 0.15ms | -0.0028ms | -1.91% |

### verifyWebhookSignature

# Perf Report — verifyWebhookSignature.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0030ms |
| p95 | 0.02ms |
| p99 | 0.08ms |
| mean | 0.0066ms |
| stdev | 0.01ms |
| min | 0.0026ms |
| max | 0.14ms |
| total | 1.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0025ms | +0.00025ms | +10.17% |
| p50 | 0.0030ms | 0.0072ms | -0.0042ms | -58.42% |
| p95 | 0.02ms | 0.02ms | -0.0025ms | -13.52% |
| p99 | 0.08ms | 0.07ms | +0.0052ms | +7.32% |
| mean | 0.0066ms | 0.0090ms | -0.0024ms | -26.66% |
| min | 0.0026ms | 0.0024ms | +0.00025ms | +10.53% |
| max | 0.14ms | 0.15ms | -0.01ms | -8.58% |
| total | 1.32ms | 1.80ms | -0.48ms | -26.66% |

### parseDeliveryEvent

# Perf Report — parseDeliveryEvent.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00080ms |
| p99 | 0.0039ms |
| mean | 0.00057ms |
| stdev | 0.00086ms |
| min | 0.00038ms |
| max | 0.0085ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p50 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p95 | 0.00080ms | 0.00096ms | -0.00017ms | -17.34% |
| p99 | 0.0039ms | 0.0039ms | +0.000022ms | +0.58% |
| mean | 0.00057ms | 0.00062ms | -0.000054ms | -8.69% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.0085ms | 0.02ms | -0.0081ms | -48.75% |
| total | 0.11ms | 0.12ms | -0.01ms | -8.69% |

