# Perf Suite — webhook

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| verifyIncoming | 0.0030ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| verifyWebhookSignature | 0.0019ms | 0.0026ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| parseWebhookPayload | 0.00029ms | 0.00051ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| verifyIncoming | 0.06ms | 10ms | PASS |
| verifyWebhookSignature | 0.03ms | 10ms | PASS |
| parseWebhookPayload | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| verifyIncoming | 33640 B | 0 B | 102400 B | yes | PASS |
| verifyWebhookSignature | -19432 B | 0 B | 102400 B | yes | PASS |
| parseWebhookPayload | 4728 B | 0 B | 102400 B | yes | PASS |

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
| mean | 0.0043ms |
| stdev | 0.0029ms |
| min | 0.0029ms |
| max | 0.02ms |
| total | 0.87ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0030ms | 0.0030ms | -0.000037ms | -1.22% |
| p50 | 0.0032ms | 0.0032ms | -0.000041ms | -1.26% |
| p95 | 0.01ms | 0.01ms | -0.0019ms | -15.72% |
| p99 | 0.02ms | 0.04ms | -0.02ms | -59.46% |
| mean | 0.0043ms | 0.0054ms | -0.0011ms | -19.88% |
| min | 0.0029ms | 0.0029ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.07ms | -0.05ms | -68.06% |
| total | 0.87ms | 1.08ms | -0.22ms | -19.88% |

### verifyWebhookSignature

# Perf Report — verifyWebhookSignature.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0019ms |
| p50 | 0.0020ms |
| p95 | 0.0026ms |
| p99 | 0.0071ms |
| mean | 0.0022ms |
| stdev | 0.0012ms |
| min | 0.0019ms |
| max | 0.02ms |
| total | 0.43ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0019ms | 0.0019ms | +0.000041ms | +2.19% |
| p50 | 0.0020ms | 0.0020ms | -0.000041ms | -2.07% |
| p95 | 0.0026ms | 0.0030ms | -0.00038ms | -12.86% |
| p99 | 0.0071ms | 0.0053ms | +0.0019ms | +35.95% |
| mean | 0.0022ms | 0.0023ms | -0.00013ms | -5.73% |
| min | 0.0019ms | 0.0018ms | +0.000084ms | +4.69% |
| max | 0.02ms | 0.02ms | -0.0045ms | -22.50% |
| total | 0.43ms | 0.46ms | -0.03ms | -5.73% |

### parseWebhookPayload

# Perf Report — parseWebhookPayload.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00051ms |
| p99 | 0.0022ms |
| mean | 0.00038ms |
| stdev | 0.00035ms |
| min | 0.00029ms |
| max | 0.0032ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| p50 | 0.00033ms | 0.00033ms | -0.0000010ms | -0.30% |
| p95 | 0.00051ms | 0.00080ms | -0.00028ms | -35.37% |
| p99 | 0.0022ms | 0.0024ms | -0.00025ms | -10.39% |
| mean | 0.00038ms | 0.00048ms | -0.00010ms | -20.71% |
| min | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| max | 0.0032ms | 0.02ms | -0.01ms | -79.40% |
| total | 0.08ms | 0.10ms | -0.02ms | -20.71% |

