# Perf Suite — email

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| sendEmail | 0.00033ms | 0.0017ms | 5ms | 0.00034ms | PASS | stable (検知には +0.00034ms (baseline 比 +101%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| verifyWebhookSignature | 0.0021ms | 0.0076ms | 5ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| parseDeliveryEvent | 0.00029ms | 0.0041ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +114%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| sendEmail | cpu | 0.08ms | 0.00033ms | 0.004 | 0.004 | 0.00034ms | 0.00033ms |
| verifyWebhookSignature | cpu | 0.08ms | 0.0021ms | 0.026 | 0.027 | 0.0021ms | 0.0022ms |
| parseDeliveryEvent | cpu | 0.08ms | 0.00029ms | 0.004 | 0.004 | 0.00029ms | 0.00029ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| sendEmail | 0.01ms | 10ms | PASS |
| verifyWebhookSignature | 0.03ms | 10ms | PASS |
| parseDeliveryEvent | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| sendEmail | 177776 B | 0 B | 102400 B | yes | PASS |
| verifyWebhookSignature | -28840 B | 0 B | 102400 B | yes | PASS |
| parseDeliveryEvent | 9160 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### sendEmail

# Perf Report — sendEmail.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.0017ms |
| p99 | 0.0095ms |
| mean | 0.00069ms |
| stdev | 0.0013ms |
| min | 0.00029ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| p50 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p95 | 0.0017ms | 0.0067ms | -0.0049ms | -73.97% |
| p99 | 0.0095ms | 0.02ms | -0.0061ms | -39.35% |
| mean | 0.00069ms | 0.0015ms | -0.00079ms | -53.37% |
| min | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.05ms | -0.04ms | -80.09% |
| total | 0.14ms | 0.29ms | -0.16ms | -53.37% |

### verifyWebhookSignature

# Perf Report — verifyWebhookSignature.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0021ms |
| p50 | 0.0022ms |
| p95 | 0.0076ms |
| p99 | 0.02ms |
| mean | 0.0031ms |
| stdev | 0.0042ms |
| min | 0.0019ms |
| max | 0.04ms |
| total | 0.63ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0021ms | 0.0022ms | -0.000084ms | -3.88% |
| p50 | 0.0022ms | 0.0024ms | -0.00021ms | -8.61% |
| p95 | 0.0076ms | 0.01ms | -0.0051ms | -40.09% |
| p99 | 0.02ms | 0.04ms | -0.02ms | -59.89% |
| mean | 0.0031ms | 0.0044ms | -0.0013ms | -29.03% |
| min | 0.0019ms | 0.0021ms | -0.00017ms | -8.02% |
| max | 0.04ms | 0.08ms | -0.04ms | -46.02% |
| total | 0.63ms | 0.89ms | -0.26ms | -29.03% |

### parseDeliveryEvent

# Perf Report — parseDeliveryEvent.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.0041ms |
| p99 | 0.0098ms |
| mean | 0.00087ms |
| stdev | 0.0020ms |
| min | 0.00025ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| p50 | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| p95 | 0.0041ms | 0.0053ms | -0.0012ms | -22.42% |
| p99 | 0.0098ms | 0.01ms | -0.0016ms | -13.87% |
| mean | 0.00087ms | 0.0011ms | -0.00026ms | -23.35% |
| min | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.02ms | -0.0058ms | -23.61% |
| total | 0.17ms | 0.23ms | -0.05ms | -23.35% |

