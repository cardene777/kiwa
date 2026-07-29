# Perf Suite — webhook

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| verifyIncoming | 0.0029ms | 0.010ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| verifyWebhookSignature | 0.0018ms | 0.0030ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| parseWebhookPayload | 0.00029ms | 0.00083ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| verifyIncoming | 0.05ms | 10ms | PASS |
| verifyWebhookSignature | 0.03ms | 10ms | PASS |
| parseWebhookPayload | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| verifyIncoming | 42872 B | 16384 B | 102400 B | yes | PASS |
| verifyWebhookSignature | -17624 B | 0 B | 102400 B | yes | PASS |
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
| p95 | 0.010ms |
| p99 | 0.01ms |
| mean | 0.0041ms |
| stdev | 0.0026ms |
| min | 0.0028ms |
| max | 0.02ms |
| total | 0.82ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0029ms | 0.0030ms | -0.00012ms | -3.95% |
| p50 | 0.0031ms | 0.0032ms | -0.00012ms | -3.85% |
| p95 | 0.010ms | 0.01ms | -0.0024ms | -19.30% |
| p99 | 0.01ms | 0.04ms | -0.03ms | -67.18% |
| mean | 0.0041ms | 0.0054ms | -0.0013ms | -24.56% |
| min | 0.0028ms | 0.0029ms | -0.000042ms | -1.46% |
| max | 0.02ms | 0.07ms | -0.05ms | -68.12% |
| total | 0.82ms | 1.08ms | -0.27ms | -24.56% |

### verifyWebhookSignature

# Perf Report — verifyWebhookSignature.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0018ms |
| p50 | 0.0019ms |
| p95 | 0.0030ms |
| p99 | 0.0090ms |
| mean | 0.0021ms |
| stdev | 0.0011ms |
| min | 0.0018ms |
| max | 0.01ms |
| total | 0.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0018ms | 0.0019ms | -0.000083ms | -4.43% |
| p50 | 0.0019ms | 0.0020ms | -0.00013ms | -6.25% |
| p95 | 0.0030ms | 0.0030ms | -0.0000052ms | -0.18% |
| p99 | 0.0090ms | 0.0053ms | +0.0038ms | +72.09% |
| mean | 0.0021ms | 0.0023ms | -0.00020ms | -8.60% |
| min | 0.0018ms | 0.0018ms | -0.000041ms | -2.29% |
| max | 0.01ms | 0.02ms | -0.0082ms | -40.84% |
| total | 0.42ms | 0.46ms | -0.04ms | -8.60% |

### parseWebhookPayload

# Perf Report — parseWebhookPayload.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00083ms |
| p99 | 0.0044ms |
| mean | 0.00046ms |
| stdev | 0.00082ms |
| min | 0.00029ms |
| max | 0.0096ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| p50 | 0.00033ms | 0.00033ms | -0.0000010ms | -0.30% |
| p95 | 0.00083ms | 0.00080ms | +0.000037ms | +4.63% |
| p99 | 0.0044ms | 0.0024ms | +0.0019ms | +80.24% |
| mean | 0.00046ms | 0.00048ms | -0.000029ms | -5.90% |
| min | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| max | 0.0096ms | 0.02ms | -0.0057ms | -37.40% |
| total | 0.09ms | 0.10ms | -0.0057ms | -5.90% |

