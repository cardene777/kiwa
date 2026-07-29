# Perf Suite — cli

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| runSpecToTest | 0.10ms | 0.58ms | 20ms | 0.00057ms | PASS | regressed — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| runSpecToTest | fs-write | 0.10ms | 0.10ms | 1.066 | 0.882 | 0.14ms | 0.12ms |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| runSpecToTest | 4.37ms | 40ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| runSpecToTest | 11880 B | -42276 B | 102400 B | yes | PASS |

## Detailed serial reports

### runSpecToTest

# Perf Report — runSpecToTest.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.10ms |
| p50 | 0.16ms |
| p95 | 0.58ms |
| p99 | 0.82ms |
| mean | 0.24ms |
| stdev | 0.19ms |
| min | 0.09ms |
| max | 1.29ms |
| total | 23.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.10ms | 0.12ms | -0.01ms | -12.22% |
| p50 | 0.16ms | 0.16ms | +0.00079ms | +0.49% |
| p95 | 0.58ms | 0.43ms | +0.15ms | +35.04% |
| p99 | 0.82ms | 0.79ms | +0.02ms | +3.04% |
| mean | 0.24ms | 0.21ms | +0.03ms | +15.24% |
| min | 0.09ms | 0.10ms | -0.01ms | -12.19% |
| max | 1.29ms | 0.98ms | +0.31ms | +31.92% |
| total | 23.64ms | 20.51ms | +3.13ms | +15.24% |

