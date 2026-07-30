# Perf Suite — cli-test

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| writeFile | 0.09ms | 0.16ms | 20ms | 0.00039ms | PASS | stable — gate 無効 (regressionGate=false) |
| readFile | 0.04ms | 0.08ms | 10ms | 0.00038ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| writeFile | fs-write | 0.06ms | 0.12ms | 0.09ms | 1.535 | 1.489 | 0.11ms | 0.11ms |
| readFile | fs-read | 0.04ms | 0.08ms | 0.04ms | 1.027 | 1.006 | 0.04ms | 0.04ms |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| writeFile | 0.27ms | 40ms | PASS |
| readFile | 0.18ms | 20ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| writeFile | 9944 B | -80592 B | 102400 B | yes | PASS |
| readFile | 6672 B | -193563 B | 102400 B | yes | PASS |

## Detailed serial reports

### writeFile

# Perf Report — writeFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.09ms |
| p50 | 0.11ms |
| p95 | 0.16ms |
| p99 | 0.19ms |
| mean | 0.11ms |
| stdev | 0.02ms |
| min | 0.09ms |
| max | 0.21ms |
| total | 11.50ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.188)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.11ms | 0.11ms | +0.0033ms | +3.04% |
| p50 | 0.13ms | 0.13ms | -0.0059ms | -4.45% |
| p95 | 0.19ms | 0.22ms | -0.02ms | -10.66% |
| p99 | 0.22ms | 0.25ms | -0.03ms | -10.70% |
| mean | 0.14ms | 0.14ms | -0.0066ms | -4.64% |
| min | 0.11ms | 0.10ms | +0.0074ms | +7.45% |
| max | 0.25ms | 0.32ms | -0.07ms | -22.86% |
| total | 13.65ms | 14.32ms | -0.66ms | -4.64% |

### readFile

# Perf Report — readFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.08ms |
| p99 | 0.14ms |
| mean | 0.05ms |
| stdev | 0.02ms |
| min | 0.04ms |
| max | 0.16ms |
| total | 5.09ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.130)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | +0.00088ms | +2.13% |
| p50 | 0.05ms | 0.06ms | -0.0087ms | -14.73% |
| p95 | 0.09ms | 0.28ms | -0.19ms | -66.62% |
| p99 | 0.15ms | 0.78ms | -0.63ms | -80.39% |
| mean | 0.06ms | 0.12ms | -0.06ms | -51.10% |
| min | 0.04ms | 0.04ms | +0.0034ms | +9.20% |
| max | 0.18ms | 1.70ms | -1.52ms | -89.37% |
| total | 5.75ms | 11.76ms | -6.01ms | -51.10% |

