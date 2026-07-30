# Perf Suite — remix

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeLoader | 0.0034ms | 0.02ms | 5ms | 0.00031ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeAction | 0.0028ms | 0.0050ms | 5ms | 0.00032ms | PASS | regressed — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| invokeLoader | cpu | 0.09ms | 0.09ms | 0.0034ms | 0.040 | 0.039 | 0.0032ms | 0.0031ms |
| invokeAction | cpu | 0.09ms | 0.09ms | 0.0028ms | 0.033 | 0.019 | 0.0027ms | 0.0016ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeLoader | 0.06ms | 10ms | PASS |
| invokeAction | 0.04ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeLoader | -48320 B | 0 B | 102400 B | yes | PASS |
| invokeAction | 3448 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeLoader

# Perf Report — invokeLoader.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0034ms |
| p50 | 0.0044ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.0064ms |
| stdev | 0.0070ms |
| min | 0.0031ms |
| max | 0.06ms |
| total | 1.28ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.943)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0032ms | 0.0031ms | +0.000092ms | +2.96% |
| p50 | 0.0042ms | 0.0038ms | +0.00037ms | +9.86% |
| p95 | 0.02ms | 0.02ms | -0.0011ms | -6.18% |
| p99 | 0.04ms | 0.04ms | +0.0026ms | +7.23% |
| mean | 0.0060ms | 0.0057ms | +0.00034ms | +5.98% |
| min | 0.0029ms | 0.0029ms | +0.000032ms | +1.12% |
| max | 0.06ms | 0.05ms | +0.0074ms | +14.87% |
| total | 1.20ms | 1.14ms | +0.07ms | +5.98% |

### invokeAction

# Perf Report — invokeAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0028ms |
| p50 | 0.0030ms |
| p95 | 0.0050ms |
| p99 | 0.01ms |
| mean | 0.0034ms |
| stdev | 0.0025ms |
| min | 0.0028ms |
| max | 0.04ms |
| total | 0.69ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.957)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0016ms | +0.0011ms | +71.27% |
| p50 | 0.0028ms | 0.0018ms | +0.0011ms | +61.77% |
| p95 | 0.0048ms | 0.0060ms | -0.0013ms | -21.35% |
| p99 | 0.01ms | 0.03ms | -0.02ms | -66.04% |
| mean | 0.0033ms | 0.0033ms | -0.000012ms | -0.37% |
| min | 0.0027ms | 0.0015ms | +0.0012ms | +78.01% |
| max | 0.03ms | 0.06ms | -0.02ms | -42.41% |
| total | 0.66ms | 0.66ms | -0.0025ms | -0.37% |

