# Perf Suite — webhook

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| verifyIncoming | 0.0032ms | 0.01ms | 5ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| verifyWebhookSignature | 0.0020ms | 0.0028ms | 5ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| parseWebhookPayload | 0.00029ms | 0.00079ms | 5ms | 0.00042ms | PASS | stable (検知には +0.00042ms (baseline 比 +125%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| verifyIncoming | 0.22ms | 10ms | PASS |
| verifyWebhookSignature | 0.04ms | 10ms | PASS |
| parseWebhookPayload | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| verifyIncoming | 48144 B | 16384 B | 102400 B | yes | PASS |
| verifyWebhookSignature | 4176 B | 16384 B | 102400 B | yes | PASS |
| parseWebhookPayload | 2464 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### verifyIncoming

# Perf Report — verifyIncoming.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0032ms |
| p50 | 0.0041ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0048ms |
| stdev | 0.0027ms |
| min | 0.0030ms |
| max | 0.02ms |
| total | 0.96ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0032ms | 0.0030ms | +0.00013ms | +4.28% |
| p50 | 0.0041ms | 0.0032ms | +0.00083ms | +25.65% |
| p95 | 0.01ms | 0.01ms | -0.0019ms | -15.07% |
| p99 | 0.02ms | 0.04ms | -0.02ms | -58.26% |
| mean | 0.0048ms | 0.0054ms | -0.00064ms | -11.75% |
| min | 0.0030ms | 0.0029ms | +0.00017ms | +5.77% |
| max | 0.02ms | 0.07ms | -0.05ms | -67.39% |
| total | 0.96ms | 1.08ms | -0.13ms | -11.75% |

### verifyWebhookSignature

# Perf Report — verifyWebhookSignature.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0020ms |
| p50 | 0.0021ms |
| p95 | 0.0028ms |
| p99 | 0.0094ms |
| mean | 0.0023ms |
| stdev | 0.0012ms |
| min | 0.0020ms |
| max | 0.01ms |
| total | 0.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0020ms | 0.0019ms | +0.00017ms | +8.85% |
| p50 | 0.0021ms | 0.0020ms | +0.00013ms | +6.25% |
| p95 | 0.0028ms | 0.0030ms | -0.00016ms | -5.49% |
| p99 | 0.0094ms | 0.0053ms | +0.0041ms | +78.50% |
| mean | 0.0023ms | 0.0023ms | +0.000052ms | +2.29% |
| min | 0.0020ms | 0.0018ms | +0.00017ms | +9.32% |
| max | 0.01ms | 0.02ms | -0.0067ms | -33.54% |
| total | 0.47ms | 0.46ms | +0.01ms | +2.29% |

### parseWebhookPayload

# Perf Report — parseWebhookPayload.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00079ms |
| p99 | 0.0035ms |
| mean | 0.00046ms |
| stdev | 0.00077ms |
| min | 0.00029ms |
| max | 0.0077ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00033ms | -0.000041ms | -12.31% |
| p50 | 0.00033ms | 0.00033ms | -0.0000010ms | -0.30% |
| p95 | 0.00079ms | 0.00080ms | -0.0000030ms | -0.38% |
| p99 | 0.0035ms | 0.0024ms | +0.0011ms | +45.69% |
| mean | 0.00046ms | 0.00048ms | -0.000026ms | -5.30% |
| min | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| max | 0.0077ms | 0.02ms | -0.0076ms | -49.59% |
| total | 0.09ms | 0.10ms | -0.0051ms | -5.30% |

