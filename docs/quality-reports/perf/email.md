# Perf Suite — email

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| sendEmail | 0.00033ms | 0.0017ms | 5ms | 0.00033ms | PASS | stable (差 0.00012ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| verifyWebhookSignature | 0.0024ms | 0.0071ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
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
| sendEmail | 31856 B | 0 B | 102400 B | yes | PASS |
| verifyWebhookSignature | -28128 B | 0 B | 102400 B | yes | PASS |
| parseDeliveryEvent | 4224 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### sendEmail

# Perf Report — sendEmail.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00042ms |
| p95 | 0.0017ms |
| p99 | 0.02ms |
| mean | 0.00093ms |
| stdev | 0.0025ms |
| min | 0.00029ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00046ms | -0.00012ms | -27.07% |
| p50 | 0.00042ms | 0.00046ms | -0.000042ms | -9.15% |
| p95 | 0.0017ms | 0.0018ms | -0.000084ms | -4.70% |
| p99 | 0.02ms | 0.0059ms | +0.01ms | +209.46% |
| mean | 0.00093ms | 0.00073ms | +0.00020ms | +27.37% |
| min | 0.00029ms | 0.00042ms | -0.00012ms | -29.81% |
| max | 0.02ms | 0.02ms | +0.0046ms | +28.32% |
| total | 0.19ms | 0.15ms | +0.04ms | +27.37% |

### verifyWebhookSignature

# Perf Report — verifyWebhookSignature.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0024ms |
| p50 | 0.0025ms |
| p95 | 0.0071ms |
| p99 | 0.01ms |
| mean | 0.0031ms |
| stdev | 0.0022ms |
| min | 0.0023ms |
| max | 0.02ms |
| total | 0.63ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0024ms | 0.0025ms | -0.000042ms | -1.71% |
| p50 | 0.0025ms | 0.0072ms | -0.0047ms | -65.11% |
| p95 | 0.0071ms | 0.02ms | -0.01ms | -62.08% |
| p99 | 0.01ms | 0.07ms | -0.06ms | -80.80% |
| mean | 0.0031ms | 0.0090ms | -0.0059ms | -65.08% |
| min | 0.0023ms | 0.0024ms | -0.000042ms | -1.77% |
| max | 0.02ms | 0.15ms | -0.14ms | -90.26% |
| total | 0.63ms | 1.80ms | -1.17ms | -65.08% |

### parseDeliveryEvent

# Perf Report — parseDeliveryEvent.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00038ms |
| p95 | 0.00080ms |
| p99 | 0.0038ms |
| mean | 0.00054ms |
| stdev | 0.00091ms |
| min | 0.00033ms |
| max | 0.0096ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p50 | 0.00038ms | 0.00042ms | -0.000042ms | -10.07% |
| p95 | 0.00080ms | 0.00096ms | -0.00017ms | -17.34% |
| p99 | 0.0038ms | 0.0039ms | -0.00011ms | -2.71% |
| mean | 0.00054ms | 0.00062ms | -0.000078ms | -12.62% |
| min | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| max | 0.0096ms | 0.02ms | -0.0070ms | -41.96% |
| total | 0.11ms | 0.12ms | -0.02ms | -12.62% |

