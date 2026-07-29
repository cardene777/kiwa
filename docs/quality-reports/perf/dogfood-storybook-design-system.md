# Perf Suite — dogfood-storybook-design-system

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| registerAndDiscover | 0.02ms | 0.05ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| runPlayFunctionsForAll | 0.11ms | 0.32ms | 80ms | 0.00034ms | PASS | stable (p10 +0% (閾値未満)、 p95 +24% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| runA11yForAll | 0.27ms | 0.43ms | 80ms | 0.00035ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| registerAndDiscover | cpu | 0.08ms | 0.02ms | 0.271 | 0.268 | 0.02ms | 0.02ms |
| runPlayFunctionsForAll | cpu | 0.08ms | 0.11ms | 1.351 | 1.347 | 0.11ms | 0.11ms |
| runA11yForAll | cpu | 0.08ms | 0.27ms | 3.397 | 3.462 | 0.28ms | 0.29ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| registerAndDiscover | 0.38ms | 100ms | PASS |
| runPlayFunctionsForAll | 1.20ms | 160ms | PASS |
| runA11yForAll | 3.33ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| registerAndDiscover | 192 B | 0 B | 102400 B | yes | PASS |
| runPlayFunctionsForAll | -10312 B | 0 B | 102400 B | yes | PASS |
| runA11yForAll | -10472 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### registerAndDiscover

# Perf Report — registerAndDiscover.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.05ms |
| p99 | 0.08ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.10ms |
| total | 1.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00025ms | +1.11% |
| p50 | 0.02ms | 0.03ms | -0.00044ms | -1.73% |
| p95 | 0.05ms | 0.07ms | -0.02ms | -26.94% |
| p99 | 0.08ms | 0.15ms | -0.06ms | -43.29% |
| mean | 0.03ms | 0.03ms | -0.0024ms | -7.04% |
| min | 0.02ms | 0.02ms | +0.00050ms | +2.38% |
| max | 0.10ms | 0.18ms | -0.08ms | -43.61% |
| total | 1.25ms | 1.35ms | -0.09ms | -7.04% |

### runPlayFunctionsForAll

# Perf Report — runPlayFunctionsForAll.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.11ms |
| p50 | 0.13ms |
| p95 | 0.32ms |
| p99 | 0.33ms |
| mean | 0.15ms |
| stdev | 0.06ms |
| min | 0.11ms |
| max | 0.34ms |
| total | 6.00ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.11ms | 0.11ms | -0.0021ms | -1.92% |
| p50 | 0.13ms | 0.13ms | -0.00023ms | -0.17% |
| p95 | 0.32ms | 0.26ms | +0.06ms | +21.58% |
| p99 | 0.33ms | 0.32ms | +0.0083ms | +2.55% |
| mean | 0.15ms | 0.14ms | +0.0050ms | +3.45% |
| min | 0.11ms | 0.11ms | -0.00063ms | -0.59% |
| max | 0.34ms | 0.36ms | -0.02ms | -6.05% |
| total | 6.00ms | 5.80ms | +0.20ms | +3.45% |

### runA11yForAll

# Perf Report — runA11yForAll.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.27ms |
| p50 | 0.31ms |
| p95 | 0.43ms |
| p99 | 0.52ms |
| mean | 0.32ms |
| stdev | 0.06ms |
| min | 0.27ms |
| max | 0.53ms |
| total | 12.89ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.27ms | 0.29ms | -0.02ms | -5.61% |
| p50 | 0.31ms | 0.32ms | -0.02ms | -4.94% |
| p95 | 0.43ms | 0.51ms | -0.08ms | -15.05% |
| p99 | 0.52ms | 0.60ms | -0.08ms | -13.76% |
| mean | 0.32ms | 0.35ms | -0.02ms | -6.86% |
| min | 0.27ms | 0.28ms | -0.01ms | -3.99% |
| max | 0.53ms | 0.65ms | -0.12ms | -18.78% |
| total | 12.89ms | 13.84ms | -0.95ms | -6.86% |

