# Perf Suite — dogfood-storybook-design-system

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00046ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00092ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| registerAndDiscover | 0.02ms | 0.05ms | 50ms | 0.00090ms | PASS | stable — gate 無効 (regressionGate=false) |
| runPlayFunctionsForAll | 0.12ms | 0.56ms | 80ms | 0.00092ms | PASS | stable (換算後 p10 +9% (閾値未満)、 p95 +92% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| runA11yForAll | 0.30ms | 1.38ms | 80ms | 0.00088ms | PASS | stable (換算後 p10 +3% (閾値未満)、 p95 +178% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| registerAndDiscover | cpu | 0.08ms | 0.09ms | 0.02ms | 0.281 | 0.266 | 0.02ms | 0.02ms |
| runPlayFunctionsForAll | cpu | 0.08ms | 0.14ms | 0.12ms | 1.434 | 1.320 | 0.12ms | 0.11ms |
| runA11yForAll | cpu | 0.08ms | 0.13ms | 0.30ms | 3.587 | 3.486 | 0.29ms | 0.28ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| registerAndDiscover | 13.65ms | 100ms | PASS |
| runPlayFunctionsForAll | 2.51ms | 160ms | PASS |
| runA11yForAll | 5.31ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| registerAndDiscover | -6864 B | 0 B | 102400 B | yes | PASS |
| runPlayFunctionsForAll | -9192 B | 0 B | 102400 B | yes | PASS |
| runA11yForAll | -8648 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### registerAndDiscover

# Perf Report — registerAndDiscover.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.03ms |
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.0083ms |
| min | 0.02ms |
| max | 0.05ms |
| total | 1.22ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.984)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.0012ms | +5.61% |
| p50 | 0.03ms | 0.02ms | +0.0018ms | +7.62% |
| p95 | 0.05ms | 0.05ms | -0.0014ms | -2.93% |
| p99 | 0.05ms | 0.05ms | -0.0048ms | -8.90% |
| mean | 0.03ms | 0.03ms | +0.0019ms | +6.86% |
| min | 0.02ms | 0.02ms | +0.0041ms | +22.22% |
| max | 0.05ms | 0.06ms | -0.0054ms | -9.54% |
| total | 1.20ms | 1.13ms | +0.08ms | +6.86% |

### runPlayFunctionsForAll

# Perf Report — runPlayFunctionsForAll.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.12ms |
| p50 | 0.14ms |
| p95 | 0.56ms |
| p99 | 0.84ms |
| mean | 0.22ms |
| stdev | 0.18ms |
| min | 0.12ms |
| max | 0.98ms |
| total | 8.60ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.002)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.12ms | 0.11ms | +0.0094ms | +8.61% |
| p50 | 0.14ms | 0.12ms | +0.02ms | +13.77% |
| p95 | 0.56ms | 0.29ms | +0.27ms | +91.71% |
| p99 | 0.84ms | 0.38ms | +0.46ms | +121.89% |
| mean | 0.22ms | 0.15ms | +0.07ms | +48.32% |
| min | 0.12ms | 0.11ms | +0.0091ms | +8.41% |
| max | 0.98ms | 0.43ms | +0.55ms | +129.36% |
| total | 8.62ms | 5.81ms | +2.81ms | +48.32% |

### runA11yForAll

# Perf Report — runA11yForAll.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.30ms |
| p50 | 0.37ms |
| p95 | 1.38ms |
| p99 | 1.90ms |
| mean | 0.54ms |
| stdev | 0.41ms |
| min | 0.29ms |
| max | 2.13ms |
| total | 21.49ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.963)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.29ms | 0.28ms | +0.0082ms | +2.90% |
| p50 | 0.36ms | 0.31ms | +0.05ms | +14.55% |
| p95 | 1.33ms | 0.48ms | +0.85ms | +178.09% |
| p99 | 1.83ms | 0.62ms | +1.21ms | +195.00% |
| mean | 0.52ms | 0.33ms | +0.18ms | +54.59% |
| min | 0.28ms | 0.28ms | +0.000061ms | +0.02% |
| max | 2.05ms | 0.63ms | +1.42ms | +227.20% |
| total | 20.70ms | 13.39ms | +7.31ms | +54.59% |

