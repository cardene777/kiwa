# Perf Suite — email

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| sendEmail | 0.00038ms | 0.00089ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| verifyWebhookSignature | 0.0027ms | 0.0084ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| parseDeliveryEvent | 0.00038ms | 0.00071ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| sendEmail | 0.01ms | 10ms | PASS |
| verifyWebhookSignature | 0.04ms | 10ms | PASS |
| parseDeliveryEvent | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| sendEmail | 30864 B | 0 B | 102400 B | yes | PASS |
| verifyWebhookSignature | -13976 B | 16384 B | 102400 B | yes | PASS |
| parseDeliveryEvent | 7544 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### sendEmail

# Perf Report — sendEmail.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00046ms |
| p95 | 0.00089ms |
| p99 | 0.0034ms |
| mean | 0.00055ms |
| stdev | 0.00063ms |
| min | 0.00033ms |
| max | 0.0069ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00046ms | -0.000083ms | -18.12% |
| p50 | 0.00046ms | 0.00046ms | -0.0000010ms | -0.22% |
| p95 | 0.00089ms | 0.0018ms | -0.00090ms | -50.47% |
| p99 | 0.0034ms | 0.0059ms | -0.0025ms | -42.40% |
| mean | 0.00055ms | 0.00073ms | -0.00018ms | -24.28% |
| min | 0.00033ms | 0.00042ms | -0.000083ms | -19.95% |
| max | 0.0069ms | 0.02ms | -0.0094ms | -57.65% |
| total | 0.11ms | 0.15ms | -0.04ms | -24.28% |

### verifyWebhookSignature

# Perf Report — verifyWebhookSignature.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0030ms |
| p95 | 0.0084ms |
| p99 | 0.01ms |
| mean | 0.0036ms |
| stdev | 0.0020ms |
| min | 0.0027ms |
| max | 0.02ms |
| total | 0.72ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0025ms | +0.00029ms | +11.88% |
| p50 | 0.0030ms | 0.0072ms | -0.0041ms | -57.84% |
| p95 | 0.0084ms | 0.02ms | -0.01ms | -54.75% |
| p99 | 0.01ms | 0.07ms | -0.06ms | -83.18% |
| mean | 0.0036ms | 0.0090ms | -0.0054ms | -60.06% |
| min | 0.0027ms | 0.0024ms | +0.00029ms | +12.29% |
| max | 0.02ms | 0.15ms | -0.14ms | -89.53% |
| total | 0.72ms | 1.80ms | -1.08ms | -60.06% |

### parseDeliveryEvent

# Perf Report — parseDeliveryEvent.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00071ms |
| p99 | 0.0043ms |
| mean | 0.00057ms |
| stdev | 0.0011ms |
| min | 0.00038ms |
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p50 | 0.00042ms | 0.00042ms | -0.0000010ms | -0.24% |
| p95 | 0.00071ms | 0.00096ms | -0.00025ms | -26.27% |
| p99 | 0.0043ms | 0.0039ms | +0.00037ms | +9.51% |
| mean | 0.00057ms | 0.00062ms | -0.000051ms | -8.15% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.02ms | -0.0058ms | -35.18% |
| total | 0.11ms | 0.12ms | -0.01ms | -8.15% |

