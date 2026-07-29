# Perf Suite — webhook

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| verifyIncoming | 0.0030ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| verifyWebhookSignature | 0.0019ms | 0.0025ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| parseWebhookPayload | 0.00029ms | 0.00039ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| verifyIncoming | 0.06ms | 10ms | PASS |
| verifyWebhookSignature | 0.03ms | 10ms | PASS |
| parseWebhookPayload | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| verifyIncoming | 37680 B | 0 B | 102400 B | yes | PASS |
| verifyWebhookSignature | -22936 B | 0 B | 102400 B | yes | PASS |
| parseWebhookPayload | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### verifyIncoming

# Perf Report — verifyIncoming.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0030ms |
| p50 | 0.0032ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0045ms |
| stdev | 0.0034ms |
| min | 0.0029ms |
| max | 0.02ms |
| total | 0.90ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0030ms | 0.0030ms | -0.000037ms | -1.22% |
| p50 | 0.0032ms | 0.0032ms | -0.000042ms | -1.29% |
| p95 | 0.01ms | 0.01ms | -0.0015ms | -12.38% |
| p99 | 0.02ms | 0.04ms | -0.02ms | -52.99% |
| mean | 0.0045ms | 0.0054ms | -0.00091ms | -16.89% |
| min | 0.0029ms | 0.0029ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.07ms | -0.04ms | -65.09% |
| total | 0.90ms | 1.08ms | -0.18ms | -16.89% |

### verifyWebhookSignature

# Perf Report — verifyWebhookSignature.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0019ms |
| p50 | 0.0020ms |
| p95 | 0.0025ms |
| p99 | 0.0057ms |
| mean | 0.0021ms |
| stdev | 0.00074ms |
| min | 0.0018ms |
| max | 0.0085ms |
| total | 0.43ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0019ms | 0.0019ms | +0.000041ms | +2.19% |
| p50 | 0.0020ms | 0.0020ms | -0.000021ms | -1.03% |
| p95 | 0.0025ms | 0.0030ms | -0.00046ms | -15.38% |
| p99 | 0.0057ms | 0.0053ms | +0.00040ms | +7.55% |
| mean | 0.0021ms | 0.0023ms | -0.00016ms | -7.05% |
| min | 0.0018ms | 0.0018ms | +0.000043ms | +2.40% |
| max | 0.0085ms | 0.02ms | -0.01ms | -57.29% |
| total | 0.43ms | 0.46ms | -0.03ms | -7.05% |

### parseWebhookPayload

# Perf Report — parseWebhookPayload.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00039ms |
| p99 | 0.0020ms |
| mean | 0.00040ms |
| stdev | 0.00050ms |
| min | 0.00029ms |
| max | 0.0062ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| p50 | 0.00033ms | 0.00033ms | -0.0000010ms | -0.30% |
| p95 | 0.00039ms | 0.00080ms | -0.00041ms | -51.33% |
| p99 | 0.0020ms | 0.0024ms | -0.00038ms | -15.57% |
| mean | 0.00040ms | 0.00048ms | -0.000088ms | -18.21% |
| min | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| max | 0.0062ms | 0.02ms | -0.0092ms | -59.62% |
| total | 0.08ms | 0.10ms | -0.02ms | -18.21% |

