# Perf Suite — webhook

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| verifyIncoming | 0.0033ms | 0.03ms | 5ms | 0.00030ms | PASS | stable (換算後 p10 +1% (閾値未満)、 p95 +66% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| verifyWebhookSignature | 0.0022ms | 0.0058ms | 5ms | 0.00030ms | PASS | stable (換算後 p10 +6% (閾値未満)、 p95 +38% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| parseWebhookPayload | 0.00029ms | 0.0039ms | 5ms | 0.00028ms | PASS | stable (検知には +0.00028ms (baseline 比 +114%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| verifyIncoming | cpu | 0.09ms | 0.12ms | 0.0033ms | 0.037 | 0.036 | 0.0029ms | 0.0029ms |
| verifyWebhookSignature | cpu | 0.09ms | 0.10ms | 0.0022ms | 0.024 | 0.023 | 0.0019ms | 0.0018ms |
| parseWebhookPayload | cpu | 0.09ms | 0.12ms | 0.00029ms | 0.003 | 0.003 | 0.00025ms | 0.00025ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| verifyIncoming | 0.09ms | 10ms | PASS |
| verifyWebhookSignature | 0.04ms | 10ms | PASS |
| parseWebhookPayload | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| verifyIncoming | 41760 B | 0 B | 102400 B | yes | PASS |
| verifyWebhookSignature | -18040 B | 0 B | 102400 B | yes | PASS |
| parseWebhookPayload | 1616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### verifyIncoming

# Perf Report — verifyIncoming.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0033ms |
| p50 | 0.0040ms |
| p95 | 0.03ms |
| p99 | 0.07ms |
| mean | 0.0082ms |
| stdev | 0.01ms |
| min | 0.0032ms |
| max | 0.13ms |
| total | 1.64ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.893)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0029ms | 0.0029ms | +0.000028ms | +0.98% |
| p50 | 0.0036ms | 0.0033ms | +0.00028ms | +8.32% |
| p95 | 0.02ms | 0.01ms | +0.0096ms | +66.23% |
| p99 | 0.06ms | 0.02ms | +0.03ms | +137.90% |
| mean | 0.0073ms | 0.0050ms | +0.0023ms | +45.48% |
| min | 0.0029ms | 0.0027ms | +0.00016ms | +5.81% |
| max | 0.12ms | 0.07ms | +0.05ms | +77.26% |
| total | 1.46ms | 1.01ms | +0.46ms | +45.48% |

### verifyWebhookSignature

# Perf Report — verifyWebhookSignature.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0024ms |
| p95 | 0.0058ms |
| p99 | 0.02ms |
| mean | 0.0035ms |
| stdev | 0.0060ms |
| min | 0.0020ms |
| max | 0.07ms |
| total | 0.70ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.897)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0019ms | 0.0018ms | +0.00011ms | +5.78% |
| p50 | 0.0021ms | 0.0019ms | +0.00019ms | +9.94% |
| p95 | 0.0052ms | 0.0038ms | +0.0014ms | +37.82% |
| p99 | 0.02ms | 0.01ms | +0.0088ms | +69.32% |
| mean | 0.0031ms | 0.0025ms | +0.00066ms | +26.74% |
| min | 0.0018ms | 0.0018ms | +0.000044ms | +2.50% |
| max | 0.06ms | 0.03ms | +0.03ms | +95.93% |
| total | 0.63ms | 0.50ms | +0.13ms | +26.74% |

### parseWebhookPayload

# Perf Report — parseWebhookPayload.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.0039ms |
| p99 | 0.01ms |
| mean | 0.0011ms |
| stdev | 0.0032ms |
| min | 0.00025ms |
| max | 0.03ms |
| total | 0.22ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.857)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00025ms | +3.7e-7ms | +0.15% |
| p50 | 0.00029ms | 0.00029ms | -0.0000046ms | -1.59% |
| p95 | 0.0034ms | 0.00079ms | +0.0026ms | +325.42% |
| p99 | 0.01ms | 0.0030ms | +0.0096ms | +318.61% |
| mean | 0.00096ms | 0.00043ms | +0.00053ms | +122.72% |
| min | 0.00021ms | 0.00021ms | +0.0000054ms | +2.57% |
| max | 0.03ms | 0.01ms | +0.01ms | +112.04% |
| total | 0.19ms | 0.09ms | +0.11ms | +122.72% |

