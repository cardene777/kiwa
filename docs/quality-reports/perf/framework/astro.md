# Perf Suite — astro

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| renderAstroPage | 0.01ms | 0.05ms | 5ms | 0.00034ms | PASS | stable (p10 -2% (閾値未満)、 p95 +29% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| invokeEndpoint | 0.0080ms | 0.04ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| renderAstroPage | cpu | 0.08ms | 0.01ms | 0.133 | 0.135 | 0.01ms | 0.01ms |
| invokeEndpoint | cpu | 0.08ms | 0.0080ms | 0.099 | 0.096 | 0.0080ms | 0.0078ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| renderAstroPage | 0.14ms | 10ms | PASS |
| invokeEndpoint | 0.11ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| renderAstroPage | -106056 B | 0 B | 102400 B | yes | PASS |
| invokeEndpoint | -10576 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### renderAstroPage

# Perf Report — renderAstroPage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.05ms |
| p99 | 0.10ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.0096ms |
| max | 0.22ms |
| total | 3.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00050ms | -4.53% |
| p50 | 0.01ms | 0.01ms | -0.00044ms | -3.50% |
| p95 | 0.05ms | 0.04ms | +0.0099ms | +24.95% |
| p99 | 0.10ms | 0.12ms | -0.02ms | -13.25% |
| mean | 0.02ms | 0.02ms | +0.00062ms | +3.57% |
| min | 0.0096ms | 0.01ms | -0.00058ms | -5.71% |
| max | 0.22ms | 0.12ms | +0.09ms | +73.08% |
| total | 3.59ms | 3.47ms | +0.12ms | +3.57% |

### invokeEndpoint

# Perf Report — invokeEndpoint.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0080ms |
| p50 | 0.0089ms |
| p95 | 0.04ms |
| p99 | 0.10ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.0076ms |
| max | 0.13ms |
| total | 2.69ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0080ms | 0.0078ms | +0.00021ms | +2.67% |
| p50 | 0.0089ms | 0.0083ms | +0.00052ms | +6.25% |
| p95 | 0.04ms | 0.03ms | +0.0043ms | +12.61% |
| p99 | 0.10ms | 0.07ms | +0.04ms | +56.48% |
| mean | 0.01ms | 0.01ms | +0.0015ms | +12.83% |
| min | 0.0076ms | 0.0074ms | +0.00017ms | +2.25% |
| max | 0.13ms | 0.09ms | +0.04ms | +43.91% |
| total | 2.69ms | 2.38ms | +0.31ms | +12.83% |

