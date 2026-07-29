# Perf Suite — webhook

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| verifyIncoming | 0.0029ms | 0.0096ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| verifyWebhookSignature | 0.0019ms | 0.0032ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| parseWebhookPayload | 0.00029ms | 0.00059ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| verifyIncoming | 0.07ms | 10ms | PASS |
| verifyWebhookSignature | 0.04ms | 10ms | PASS |
| parseWebhookPayload | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| verifyIncoming | 33664 B | 0 B | 102400 B | yes | PASS |
| verifyWebhookSignature | -18984 B | 0 B | 102400 B | yes | PASS |
| parseWebhookPayload | 10320 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### verifyIncoming

# Perf Report — verifyIncoming.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0029ms |
| p50 | 0.0031ms |
| p95 | 0.0096ms |
| p99 | 0.02ms |
| mean | 0.0041ms |
| stdev | 0.0028ms |
| min | 0.0029ms |
| max | 0.02ms |
| total | 0.82ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0029ms | 0.0030ms | -0.00012ms | -3.95% |
| p50 | 0.0031ms | 0.0032ms | -0.00017ms | -5.14% |
| p95 | 0.0096ms | 0.01ms | -0.0028ms | -22.75% |
| p99 | 0.02ms | 0.04ms | -0.02ms | -59.36% |
| mean | 0.0041ms | 0.0054ms | -0.0013ms | -24.26% |
| min | 0.0029ms | 0.0029ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.07ms | -0.05ms | -66.00% |
| total | 0.82ms | 1.08ms | -0.26ms | -24.26% |

### verifyWebhookSignature

# Perf Report — verifyWebhookSignature.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0019ms |
| p50 | 0.0020ms |
| p95 | 0.0032ms |
| p99 | 0.0087ms |
| mean | 0.0023ms |
| stdev | 0.0015ms |
| min | 0.0018ms |
| max | 0.01ms |
| total | 0.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0019ms | 0.0019ms | 0.00ms | 0.00% |
| p50 | 0.0020ms | 0.0020ms | -0.000042ms | -2.10% |
| p95 | 0.0032ms | 0.0030ms | +0.00025ms | +8.33% |
| p99 | 0.0087ms | 0.0053ms | +0.0034ms | +65.10% |
| mean | 0.0023ms | 0.0023ms | +0.0000095ms | +0.42% |
| min | 0.0018ms | 0.0018ms | +0.000042ms | +2.35% |
| max | 0.01ms | 0.02ms | -0.0057ms | -28.34% |
| total | 0.46ms | 0.46ms | +0.0019ms | +0.42% |

### parseWebhookPayload

# Perf Report — parseWebhookPayload.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00059ms |
| p99 | 0.0017ms |
| mean | 0.00041ms |
| stdev | 0.00055ms |
| min | 0.00029ms |
| max | 0.0067ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| p50 | 0.00033ms | 0.00033ms | -0.0000010ms | -0.30% |
| p95 | 0.00059ms | 0.00080ms | -0.00020ms | -25.60% |
| p99 | 0.0017ms | 0.0024ms | -0.00074ms | -30.43% |
| mean | 0.00041ms | 0.00048ms | -0.000078ms | -16.14% |
| min | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| max | 0.0067ms | 0.02ms | -0.0086ms | -56.10% |
| total | 0.08ms | 0.10ms | -0.02ms | -16.14% |

