# Perf Suite — ui

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| setupComponentEnvSnapshot | 0.19ms | 0.44ms | 30ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| setupComponentEnvRender | 0.14ms | 0.27ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| setupComponentEnvSnapshot | cpu | 0.08ms | 0.19ms | 2.319 | 2.292 | 0.19ms | 0.19ms |
| setupComponentEnvRender | cpu | 0.08ms | 0.14ms | 1.707 | 1.510 | 0.14ms | 0.12ms |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| setupComponentEnvSnapshot | 2.04ms | 60ms | PASS |
| setupComponentEnvRender | 0.59ms | 60ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| setupComponentEnvSnapshot | -71672 B | 0 B | 102400 B | yes | PASS |
| setupComponentEnvRender | -72736 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### setupComponentEnvSnapshot

# Perf Report — setupComponentEnvSnapshot.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.19ms |
| p50 | 0.22ms |
| p95 | 0.44ms |
| p99 | 0.54ms |
| mean | 0.25ms |
| stdev | 0.08ms |
| min | 0.18ms |
| max | 0.56ms |
| total | 12.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.19ms | 0.19ms | -0.0028ms | -1.46% |
| p50 | 0.22ms | 0.24ms | -0.02ms | -7.99% |
| p95 | 0.44ms | 0.52ms | -0.09ms | -16.74% |
| p99 | 0.54ms | 0.99ms | -0.45ms | -45.17% |
| mean | 0.25ms | 0.29ms | -0.05ms | -15.37% |
| min | 0.18ms | 0.17ms | +0.0049ms | +2.81% |
| max | 0.56ms | 1.26ms | -0.70ms | -55.70% |
| total | 12.44ms | 14.70ms | -2.26ms | -15.37% |

### setupComponentEnvRender

# Perf Report — setupComponentEnvRender.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.14ms |
| p50 | 0.16ms |
| p95 | 0.27ms |
| p99 | 0.81ms |
| mean | 0.20ms |
| stdev | 0.15ms |
| min | 0.13ms |
| max | 1.18ms |
| total | 9.78ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.14ms | 0.12ms | +0.02ms | +13.54% |
| p50 | 0.16ms | 0.14ms | +0.02ms | +14.13% |
| p95 | 0.27ms | 0.30ms | -0.02ms | -8.13% |
| p99 | 0.81ms | 0.46ms | +0.35ms | +77.14% |
| mean | 0.20ms | 0.16ms | +0.03ms | +19.46% |
| min | 0.13ms | 0.12ms | +0.0054ms | +4.49% |
| max | 1.18ms | 0.47ms | +0.72ms | +153.97% |
| total | 9.78ms | 8.19ms | +1.59ms | +19.46% |

