# Perf Suite — remix

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeLoader | 0.0031ms | 0.02ms | 5ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeAction | 0.0027ms | 0.0076ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| invokeLoader | cpu | 0.08ms | 0.0031ms | 0.039 | 0.039 | 0.0032ms | 0.0032ms |
| invokeAction | cpu | 0.08ms | 0.0027ms | 0.033 | 0.035 | 0.0026ms | 0.0027ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeLoader | 0.04ms | 10ms | PASS |
| invokeAction | 0.03ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeLoader | -46288 B | 0 B | 102400 B | yes | PASS |
| invokeAction | 3448 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeLoader

# Perf Report — invokeLoader.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0031ms |
| p50 | 0.0040ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.0059ms |
| stdev | 0.0065ms |
| min | 0.0029ms |
| max | 0.05ms |
| total | 1.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0031ms | 0.0032ms | -0.000042ms | -1.33% |
| p50 | 0.0040ms | 0.0036ms | +0.00042ms | +11.50% |
| p95 | 0.02ms | 0.02ms | -0.0019ms | -10.02% |
| p99 | 0.04ms | 0.05ms | -0.0058ms | -12.63% |
| mean | 0.0059ms | 0.0058ms | +0.000085ms | +1.45% |
| min | 0.0029ms | 0.0029ms | 0.00ms | 0.00% |
| max | 0.05ms | 0.05ms | +0.0030ms | +6.44% |
| total | 1.18ms | 1.16ms | +0.02ms | +1.45% |

### invokeAction

# Perf Report — invokeAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0028ms |
| p95 | 0.0076ms |
| p99 | 0.02ms |
| mean | 0.0040ms |
| stdev | 0.0043ms |
| min | 0.0026ms |
| max | 0.04ms |
| total | 0.79ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0027ms | -0.000084ms | -3.05% |
| p50 | 0.0028ms | 0.0030ms | -0.00021ms | -6.89% |
| p95 | 0.0076ms | 0.0070ms | +0.00060ms | +8.58% |
| p99 | 0.02ms | 0.03ms | -0.01ms | -32.58% |
| mean | 0.0040ms | 0.0042ms | -0.00028ms | -6.53% |
| min | 0.0026ms | 0.0027ms | -0.000082ms | -3.08% |
| max | 0.04ms | 0.05ms | -0.0045ms | -9.54% |
| total | 0.79ms | 0.85ms | -0.06ms | -6.53% |

