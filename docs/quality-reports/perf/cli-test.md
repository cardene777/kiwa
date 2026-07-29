# Perf Suite — cli-test

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| writeFile | 0.12ms | 0.28ms | 20ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| readFile | 0.05ms | 0.14ms | 10ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| writeFile | fs-write | 0.08ms | 0.12ms | 1.529 | 1.572 | 0.10ms | 0.10ms |
| readFile | fs-read | 0.04ms | 0.05ms | 1.022 | 1.002 | 0.05ms | 0.04ms |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| writeFile | 1.70ms | 40ms | PASS |
| readFile | 0.15ms | 20ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| writeFile | 12416 B | -95792 B | 102400 B | yes | PASS |
| readFile | 8096 B | -60986 B | 102400 B | yes | PASS |

## Detailed serial reports

### writeFile

# Perf Report — writeFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.12ms |
| p50 | 0.15ms |
| p95 | 0.28ms |
| p99 | 0.31ms |
| mean | 0.16ms |
| stdev | 0.05ms |
| min | 0.11ms |
| max | 0.44ms |
| total | 16.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.12ms | 0.10ms | +0.02ms | +19.52% |
| p50 | 0.15ms | 0.12ms | +0.03ms | +26.50% |
| p95 | 0.28ms | 0.19ms | +0.09ms | +47.25% |
| p99 | 0.31ms | 0.22ms | +0.09ms | +39.54% |
| mean | 0.16ms | 0.13ms | +0.03ms | +25.47% |
| min | 0.11ms | 0.09ms | +0.02ms | +23.31% |
| max | 0.44ms | 0.32ms | +0.13ms | +39.44% |
| total | 16.08ms | 12.82ms | +3.26ms | +25.47% |

### readFile

# Perf Report — readFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.07ms |
| p95 | 0.14ms |
| p99 | 0.19ms |
| mean | 0.07ms |
| stdev | 0.03ms |
| min | 0.04ms |
| max | 0.23ms |
| total | 7.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.04ms | +0.00067ms | +1.50% |
| p50 | 0.07ms | 0.11ms | -0.05ms | -42.08% |
| p95 | 0.14ms | 0.36ms | -0.21ms | -60.01% |
| p99 | 0.19ms | 0.58ms | -0.39ms | -67.30% |
| mean | 0.07ms | 0.15ms | -0.08ms | -52.26% |
| min | 0.04ms | 0.04ms | +0.0045ms | +12.63% |
| max | 0.23ms | 0.74ms | -0.50ms | -68.56% |
| total | 7.15ms | 14.98ms | -7.83ms | -52.26% |

