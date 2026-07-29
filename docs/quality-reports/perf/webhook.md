# Perf Suite — webhook

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| verifyIncoming | 0.0030ms | 0.0099ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| verifyWebhookSignature | 0.0020ms | 0.0032ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| parseWebhookPayload | 0.00029ms | 0.00063ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| verifyIncoming | 0.05ms | 10ms | PASS |
| verifyWebhookSignature | 0.03ms | 10ms | PASS |
| parseWebhookPayload | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| verifyIncoming | 39632 B | 0 B | 102400 B | yes | PASS |
| verifyWebhookSignature | -17624 B | 0 B | 102400 B | yes | PASS |
| parseWebhookPayload | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### verifyIncoming

# Perf Report — verifyIncoming.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0030ms |
| p50 | 0.0032ms |
| p95 | 0.0099ms |
| p99 | 0.02ms |
| mean | 0.0043ms |
| stdev | 0.0029ms |
| min | 0.0028ms |
| max | 0.02ms |
| total | 0.86ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0030ms | 0.0030ms | -0.000078ms | -2.57% |
| p50 | 0.0032ms | 0.0032ms | -0.000042ms | -1.29% |
| p95 | 0.0099ms | 0.01ms | -0.0025ms | -19.89% |
| p99 | 0.02ms | 0.04ms | -0.02ms | -59.67% |
| mean | 0.0043ms | 0.0054ms | -0.0011ms | -20.52% |
| min | 0.0028ms | 0.0029ms | -0.000042ms | -1.46% |
| max | 0.02ms | 0.07ms | -0.04ms | -64.97% |
| total | 0.86ms | 1.08ms | -0.22ms | -20.52% |

### verifyWebhookSignature

# Perf Report — verifyWebhookSignature.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0020ms |
| p50 | 0.0021ms |
| p95 | 0.0032ms |
| p99 | 0.0092ms |
| mean | 0.0024ms |
| stdev | 0.0011ms |
| min | 0.0020ms |
| max | 0.01ms |
| total | 0.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0020ms | 0.0019ms | +0.00017ms | +8.85% |
| p50 | 0.0021ms | 0.0020ms | +0.00013ms | +6.25% |
| p95 | 0.0032ms | 0.0030ms | +0.00020ms | +6.84% |
| p99 | 0.0092ms | 0.0053ms | +0.0039ms | +74.62% |
| mean | 0.0024ms | 0.0023ms | +0.000061ms | +2.68% |
| min | 0.0020ms | 0.0018ms | +0.00017ms | +9.38% |
| max | 0.01ms | 0.02ms | -0.0093ms | -46.67% |
| total | 0.47ms | 0.46ms | +0.01ms | +2.68% |

### parseWebhookPayload

# Perf Report — parseWebhookPayload.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00063ms |
| p99 | 0.0018ms |
| mean | 0.00041ms |
| stdev | 0.00063ms |
| min | 0.00025ms |
| max | 0.0084ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| p50 | 0.00033ms | 0.00033ms | -0.0000010ms | -0.30% |
| p95 | 0.00063ms | 0.00080ms | -0.00016ms | -20.45% |
| p99 | 0.0018ms | 0.0024ms | -0.00062ms | -25.66% |
| mean | 0.00041ms | 0.00048ms | -0.000071ms | -14.69% |
| min | 0.00025ms | 0.00029ms | -0.000041ms | -14.09% |
| max | 0.0084ms | 0.02ms | -0.0070ms | -45.53% |
| total | 0.08ms | 0.10ms | -0.01ms | -14.69% |

