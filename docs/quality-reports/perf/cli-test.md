# Perf Suite — cli-test

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| writeFile | 0.12ms | 0.25ms | 20ms | 0.00031ms | PASS | stable — gate 無効 (regressionGate=false) |
| readFile | 0.04ms | 0.09ms | 10ms | 0.00035ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| writeFile | fs-write | 0.08ms | 0.22ms | 0.12ms | 1.506 | 1.489 | 0.11ms | 0.11ms |
| readFile | fs-read | 0.04ms | 0.08ms | 0.04ms | 1.033 | 1.006 | 0.04ms | 0.04ms |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| writeFile | 0.47ms | 40ms | PASS |
| readFile | 0.16ms | 20ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| writeFile | 10224 B | -22945 B | 102400 B | yes | PASS |
| readFile | 7984 B | -120479 B | 102400 B | yes | PASS |

## Detailed serial reports

### writeFile

# Perf Report — writeFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.12ms |
| p50 | 0.15ms |
| p95 | 0.25ms |
| p99 | 0.51ms |
| mean | 0.17ms |
| stdev | 0.09ms |
| min | 0.10ms |
| max | 0.78ms |
| total | 16.87ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.933)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.11ms | 0.11ms | +0.0012ms | +1.10% |
| p50 | 0.14ms | 0.13ms | +0.0099ms | +7.43% |
| p95 | 0.24ms | 0.22ms | +0.02ms | +8.95% |
| p99 | 0.48ms | 0.25ms | +0.22ms | +89.79% |
| mean | 0.16ms | 0.14ms | +0.01ms | +9.99% |
| min | 0.09ms | 0.10ms | -0.0064ms | -6.47% |
| max | 0.73ms | 0.32ms | +0.41ms | +128.95% |
| total | 15.75ms | 14.32ms | +1.43ms | +9.99% |

### readFile

# Perf Report — readFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.05ms |
| p95 | 0.09ms |
| p99 | 0.10ms |
| mean | 0.06ms |
| stdev | 0.02ms |
| min | 0.04ms |
| max | 0.10ms |
| total | 5.85ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.069)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | +0.0011ms | +2.69% |
| p50 | 0.06ms | 0.06ms | -0.00085ms | -1.44% |
| p95 | 0.10ms | 0.28ms | -0.19ms | -66.15% |
| p99 | 0.11ms | 0.78ms | -0.67ms | -85.88% |
| mean | 0.06ms | 0.12ms | -0.06ms | -46.87% |
| min | 0.04ms | 0.04ms | +0.0021ms | +5.65% |
| max | 0.11ms | 1.70ms | -1.59ms | -93.43% |
| total | 6.25ms | 11.76ms | -5.51ms | -46.87% |

