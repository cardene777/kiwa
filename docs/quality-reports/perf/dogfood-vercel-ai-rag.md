# Perf Suite — dogfood-vercel-ai-rag

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00046ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00092ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| embed | 0.0030ms | 0.02ms | 20ms | 0.00082ms | PASS | stable (換算後 p10 +4% (閾値未満)、 p95 +96% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| retrieve | 0.0059ms | 0.02ms | 30ms | 0.00082ms | PASS | regressed — gate 無効 (regressionGate=false) |
| answer | 9.09ms | 16.96ms | 100ms | 0.00085ms | PASS | stable (換算後 p10 -5% (閾値未満)、 p95 +70% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| embed | cpu | 0.09ms | 0.11ms | 0.0030ms | 0.033 | 0.032 | 0.0026ms | 0.0025ms |
| retrieve | cpu | 0.09ms | 0.09ms | 0.0059ms | 0.066 | 0.052 | 0.0053ms | 0.0042ms |
| answer | cpu | 0.09ms | 1.41ms | 9.09ms | 101.143 | 106.391 | 8.39ms | 8.82ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| embed | 0.14ms | 40ms | PASS |
| retrieve | 0.07ms | 60ms | PASS |
| answer | 10.99ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| embed | 30568 B | 0 B | 102400 B | yes | PASS |
| retrieve | 54024 B | 0 B | 102400 B | yes | PASS |
| answer | 48816 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### embed

# Perf Report — embed.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0030ms |
| p50 | 0.0055ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.0077ms |
| stdev | 0.0073ms |
| min | 0.0028ms |
| max | 0.04ms |
| total | 0.31ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.892)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0026ms | 0.0025ms | +0.000098ms | +3.86% |
| p50 | 0.0049ms | 0.0034ms | +0.0016ms | +46.87% |
| p95 | 0.02ms | 0.01ms | +0.0098ms | +96.38% |
| p99 | 0.03ms | 0.02ms | +0.01ms | +52.27% |
| mean | 0.0068ms | 0.0048ms | +0.0020ms | +42.61% |
| min | 0.0025ms | 0.0025ms | +0.000029ms | +1.17% |
| max | 0.03ms | 0.02ms | +0.01ms | +60.54% |
| total | 0.27ms | 0.19ms | +0.08ms | +42.61% |

### retrieve

# Perf Report — retrieve.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0059ms |
| p50 | 0.0066ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0082ms |
| stdev | 0.0035ms |
| min | 0.0058ms |
| max | 0.02ms |
| total | 0.33ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.895)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0053ms | 0.0042ms | +0.0011ms | +25.90% |
| p50 | 0.0059ms | 0.0063ms | -0.00040ms | -6.41% |
| p95 | 0.01ms | 0.03ms | -0.01ms | -48.36% |
| p99 | 0.02ms | 0.04ms | -0.02ms | -58.19% |
| mean | 0.0073ms | 0.0092ms | -0.0018ms | -19.93% |
| min | 0.0052ms | 0.0041ms | +0.0011ms | +25.58% |
| max | 0.02ms | 0.04ms | -0.03ms | -57.58% |
| total | 0.29ms | 0.37ms | -0.07ms | -19.93% |

### answer

# Perf Report — answer.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 9.09ms |
| p50 | 10.47ms |
| p95 | 16.96ms |
| p99 | 37.59ms |
| mean | 12.01ms |
| stdev | 6.35ms |
| min | 8.31ms |
| max | 48.48ms |
| total | 480.28ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.923)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.39ms | 8.82ms | -0.44ms | -4.93% |
| p50 | 9.67ms | 9.13ms | +0.54ms | +5.89% |
| p95 | 15.66ms | 9.22ms | +6.44ms | +69.78% |
| p99 | 34.69ms | 9.28ms | +25.41ms | +273.74% |
| mean | 11.08ms | 9.07ms | +2.01ms | +22.17% |
| min | 7.67ms | 8.25ms | -0.58ms | -7.07% |
| max | 44.74ms | 9.31ms | +35.43ms | +380.39% |
| total | 443.28ms | 362.82ms | +80.46ms | +22.17% |

