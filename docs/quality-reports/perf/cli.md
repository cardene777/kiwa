# Perf Suite — cli

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| runSpecToTest | 0.09ms | 0.16ms | 20ms | 0.00043ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| runSpecToTest | fs-write | 0.08ms | 0.18ms | 0.09ms | 1.115 | 1.305 | 0.08ms | 0.09ms |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| runSpecToTest | 0.48ms | 40ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| runSpecToTest | 14488 B | -55279 B | 102400 B | yes | PASS |

## Detailed serial reports

### runSpecToTest

# Perf Report — runSpecToTest.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.09ms |
| p50 | 0.11ms |
| p95 | 0.16ms |
| p99 | 0.22ms |
| mean | 0.12ms |
| stdev | 0.03ms |
| min | 0.08ms |
| max | 0.24ms |
| total | 11.73ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.856)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.08ms | 0.09ms | -0.01ms | -14.57% |
| p50 | 0.10ms | 0.11ms | -0.01ms | -11.43% |
| p95 | 0.14ms | 0.16ms | -0.03ms | -16.65% |
| p99 | 0.19ms | 0.20ms | -0.01ms | -5.40% |
| mean | 0.10ms | 0.12ms | -0.02ms | -13.19% |
| min | 0.07ms | 0.08ms | -0.0096ms | -12.17% |
| max | 0.21ms | 0.33ms | -0.12ms | -36.83% |
| total | 10.04ms | 11.57ms | -1.53ms | -13.19% |

