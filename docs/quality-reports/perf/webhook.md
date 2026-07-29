# Perf Suite — webhook

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| verifyIncoming | 0.0029ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| verifyWebhookSignature | 0.0019ms | 0.0026ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| parseWebhookPayload | 0.00029ms | 0.00042ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| verifyIncoming | 0.04ms | 10ms | PASS |
| verifyWebhookSignature | 0.03ms | 10ms | PASS |
| parseWebhookPayload | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| verifyIncoming | 36184 B | 0 B | 102400 B | yes | PASS |
| verifyWebhookSignature | -17376 B | 0 B | 102400 B | yes | PASS |
| parseWebhookPayload | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### verifyIncoming

# Perf Report — verifyIncoming.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0029ms |
| p50 | 0.0031ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0041ms |
| stdev | 0.0028ms |
| min | 0.0028ms |
| max | 0.02ms |
| total | 0.82ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0029ms | 0.0030ms | -0.00012ms | -3.98% |
| p50 | 0.0031ms | 0.0032ms | -0.00012ms | -3.85% |
| p95 | 0.01ms | 0.01ms | -0.0022ms | -18.14% |
| p99 | 0.02ms | 0.04ms | -0.03ms | -62.32% |
| mean | 0.0041ms | 0.0054ms | -0.0013ms | -24.13% |
| min | 0.0028ms | 0.0029ms | -0.000083ms | -2.89% |
| max | 0.02ms | 0.07ms | -0.05ms | -66.73% |
| total | 0.82ms | 1.08ms | -0.26ms | -24.13% |

### verifyWebhookSignature

# Perf Report — verifyWebhookSignature.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0019ms |
| p50 | 0.0020ms |
| p95 | 0.0026ms |
| p99 | 0.0078ms |
| mean | 0.0021ms |
| stdev | 0.00083ms |
| min | 0.0018ms |
| max | 0.0088ms |
| total | 0.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0019ms | 0.0019ms | 0.00ms | 0.00% |
| p50 | 0.0020ms | 0.0020ms | -0.000042ms | -2.10% |
| p95 | 0.0026ms | 0.0030ms | -0.00033ms | -11.23% |
| p99 | 0.0078ms | 0.0053ms | +0.0025ms | +48.25% |
| mean | 0.0021ms | 0.0023ms | -0.00018ms | -7.76% |
| min | 0.0018ms | 0.0018ms | +0.0000010ms | +0.06% |
| max | 0.0088ms | 0.02ms | -0.01ms | -56.04% |
| total | 0.42ms | 0.46ms | -0.04ms | -7.76% |

### parseWebhookPayload

# Perf Report — parseWebhookPayload.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00042ms |
| p99 | 0.0018ms |
| mean | 0.00040ms |
| stdev | 0.00055ms |
| min | 0.00029ms |
| max | 0.0071ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| p50 | 0.00033ms | 0.00033ms | -0.0000010ms | -0.30% |
| p95 | 0.00042ms | 0.00080ms | -0.00037ms | -46.84% |
| p99 | 0.0018ms | 0.0024ms | -0.00062ms | -25.61% |
| mean | 0.00040ms | 0.00048ms | -0.000080ms | -16.50% |
| min | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| max | 0.0071ms | 0.02ms | -0.0083ms | -53.66% |
| total | 0.08ms | 0.10ms | -0.02ms | -16.50% |

