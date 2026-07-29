# Perf Suite — webhook

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| verifyIncoming | 0.0031ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| verifyWebhookSignature | 0.0019ms | 0.0048ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| parseWebhookPayload | 0.00025ms | 0.00089ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +132%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| verifyIncoming | cpu | 0.08ms | 0.0031ms | 0.038 | 0.037 | 0.0031ms | 0.0030ms |
| verifyWebhookSignature | cpu | 0.08ms | 0.0019ms | 0.024 | 0.023 | 0.0019ms | 0.0019ms |
| parseWebhookPayload | cpu | 0.08ms | 0.00025ms | 0.003 | 0.003 | 0.00025ms | 0.00025ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| verifyIncoming | 0.04ms | 10ms | PASS |
| verifyWebhookSignature | 0.03ms | 10ms | PASS |
| parseWebhookPayload | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| verifyIncoming | 48920 B | 0 B | 102400 B | yes | PASS |
| verifyWebhookSignature | -18856 B | 0 B | 102400 B | yes | PASS |
| parseWebhookPayload | 24 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### verifyIncoming

# Perf Report — verifyIncoming.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0031ms |
| p50 | 0.0035ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0047ms |
| stdev | 0.0034ms |
| min | 0.0029ms |
| max | 0.02ms |
| total | 0.94ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0031ms | 0.0030ms | +0.000083ms | +2.73% |
| p50 | 0.0035ms | 0.0035ms | +0.000042ms | +1.21% |
| p95 | 0.01ms | 0.02ms | -0.0098ms | -48.40% |
| p99 | 0.02ms | 0.04ms | -0.02ms | -46.99% |
| mean | 0.0047ms | 0.0061ms | -0.0014ms | -22.87% |
| min | 0.0029ms | 0.0029ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.07ms | -0.05ms | -66.18% |
| total | 0.94ms | 1.21ms | -0.28ms | -22.87% |

### verifyWebhookSignature

# Perf Report — verifyWebhookSignature.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0019ms |
| p50 | 0.0021ms |
| p95 | 0.0048ms |
| p99 | 0.02ms |
| mean | 0.0030ms |
| stdev | 0.0046ms |
| min | 0.0018ms |
| max | 0.04ms |
| total | 0.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0019ms | 0.0019ms | +0.000042ms | +2.24% |
| p50 | 0.0021ms | 0.0020ms | +0.000042ms | +2.03% |
| p95 | 0.0048ms | 0.0044ms | +0.00033ms | +7.41% |
| p99 | 0.02ms | 0.01ms | +0.0086ms | +57.77% |
| mean | 0.0030ms | 0.0028ms | +0.00022ms | +7.91% |
| min | 0.0018ms | 0.0018ms | 0.00ms | 0.00% |
| max | 0.04ms | 0.05ms | -0.0046ms | -9.31% |
| total | 0.61ms | 0.56ms | +0.04ms | +7.91% |

### parseWebhookPayload

# Perf Report — parseWebhookPayload.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00029ms |
| p95 | 0.00089ms |
| p99 | 0.0059ms |
| mean | 0.00051ms |
| stdev | 0.0013ms |
| min | 0.00021ms |
| max | 0.02ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| p50 | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| p95 | 0.00089ms | 0.0015ms | -0.00059ms | -39.90% |
| p99 | 0.0059ms | 0.0043ms | +0.0016ms | +37.79% |
| mean | 0.00051ms | 0.00058ms | -0.000070ms | -12.12% |
| min | 0.00021ms | 0.00025ms | -0.000042ms | -16.80% |
| max | 0.02ms | 0.02ms | -0.0060ms | -28.49% |
| total | 0.10ms | 0.12ms | -0.01ms | -12.12% |

