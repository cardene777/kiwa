# Perf Suite — design-check

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| checkSpecConformance | 0.0021ms | 0.0042ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| checkLayoutRegression | 0.0059ms | 0.02ms | 5ms | 0.00037ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| checkSpecConformance | cpu | 0.08ms | 0.09ms | 0.0021ms | 0.025 | 0.026 | 0.0021ms | 0.0021ms |
| checkLayoutRegression | cpu | 0.08ms | 0.09ms | 0.0059ms | 0.074 | 0.074 | 0.0066ms | 0.0066ms |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| checkSpecConformance | 0.01ms | 10ms | PASS |
| checkLayoutRegression | 0.03ms | 10ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| checkSpecConformance | -46368 B | 0 B | 102400 B | yes | PASS |
| checkLayoutRegression | -1064 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### checkSpecConformance

# Perf Report — checkSpecConformance.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 5 |
| p10 | 0.0021ms |
| p50 | 0.0023ms |
| p95 | 0.0042ms |
| p99 | 0.0096ms |
| mean | 0.0028ms |
| stdev | 0.0017ms |
| min | 0.0020ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.001)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0021ms | 0.0021ms | -0.000045ms | -2.12% |
| p50 | 0.0023ms | 0.0022ms | +0.000043ms | +1.90% |
| p95 | 0.0042ms | 0.0068ms | -0.0026ms | -38.62% |
| p99 | 0.0096ms | 0.01ms | -0.0032ms | -25.33% |
| mean | 0.0028ms | 0.0032ms | -0.00042ms | -13.06% |
| min | 0.0020ms | 0.0021ms | -0.000082ms | -3.94% |
| max | 0.01ms | 0.02ms | -0.0032ms | -18.97% |
| total | 0.14ms | 0.16ms | -0.02ms | -13.06% |

### checkLayoutRegression

# Perf Report — checkLayoutRegression.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 5 |
| p10 | 0.0059ms |
| p50 | 0.0070ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0067ms |
| min | 0.0058ms |
| max | 0.03ms |
| total | 0.51ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.115)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0066ms | 0.0066ms | +0.000017ms | +0.26% |
| p50 | 0.0078ms | 0.0067ms | +0.0011ms | +15.69% |
| p95 | 0.02ms | 0.03ms | -0.0077ms | -24.72% |
| p99 | 0.03ms | 0.03ms | -0.0011ms | -3.18% |
| mean | 0.01ms | 0.01ms | +0.00061ms | +5.65% |
| min | 0.0065ms | 0.0065ms | -0.000036ms | -0.54% |
| max | 0.04ms | 0.04ms | -0.00034ms | -0.96% |
| total | 0.57ms | 0.54ms | +0.03ms | +5.65% |

