# Perf Suite — astro

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| renderAstroPage | 0.01ms | 0.03ms | 5ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeEndpoint | 0.0077ms | 0.02ms | 5ms | 0.00034ms | PASS | regressed — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| renderAstroPage | cpu | 0.08ms | 0.09ms | 0.01ms | 0.136 | 0.138 | 0.01ms | 0.01ms |
| invokeEndpoint | cpu | 0.08ms | 0.09ms | 0.0077ms | 0.096 | 0.068 | 0.0080ms | 0.0057ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| renderAstroPage | 0.16ms | 10ms | PASS |
| invokeEndpoint | 0.10ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| renderAstroPage | -112448 B | 0 B | 102400 B | yes | PASS |
| invokeEndpoint | -12552 B | 1749 B | 102400 B | yes | PASS |

## Detailed serial reports

### renderAstroPage

# Perf Report — renderAstroPage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.11ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.0097ms |
| max | 0.13ms |
| total | 3.28ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.031)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00017ms | -1.49% |
| p50 | 0.01ms | 0.01ms | -0.0018ms | -12.57% |
| p95 | 0.04ms | 0.07ms | -0.03ms | -49.00% |
| p99 | 0.11ms | 0.24ms | -0.13ms | -54.37% |
| mean | 0.02ms | 0.03ms | -0.0087ms | -34.07% |
| min | 0.01ms | 0.010ms | +0.000090ms | +0.91% |
| max | 0.13ms | 0.49ms | -0.36ms | -73.03% |
| total | 3.38ms | 5.12ms | -1.75ms | -34.07% |

### invokeEndpoint

# Perf Report — invokeEndpoint.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0077ms |
| p50 | 0.0083ms |
| p95 | 0.02ms |
| p99 | 0.06ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0075ms |
| max | 0.15ms |
| total | 2.23ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.032)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0080ms | 0.0057ms | +0.0023ms | +41.00% |
| p50 | 0.0086ms | 0.0090ms | -0.00038ms | -4.26% |
| p95 | 0.02ms | 0.12ms | -0.10ms | -81.60% |
| p99 | 0.06ms | 0.24ms | -0.18ms | -74.33% |
| mean | 0.01ms | 0.03ms | -0.02ms | -60.75% |
| min | 0.0077ms | 0.0052ms | +0.0025ms | +47.72% |
| max | 0.15ms | 0.27ms | -0.12ms | -44.23% |
| total | 2.30ms | 5.86ms | -3.56ms | -60.75% |

