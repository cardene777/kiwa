# Perf Suite — visual

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| comparePngBuffersIdentical | 0.32ms | 0.61ms | 50ms | 0.00043ms | PASS | stable — gate 無効 (regressionGate=false) |
| comparePngBuffersFullDiff | 5.38ms | 7.80ms | 200ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| comparePngBuffersIdentical | cpu | 0.08ms | 0.32ms | 3.885 | 4.488 | 0.32ms | 0.37ms |
| comparePngBuffersFullDiff | cpu | 0.08ms | 5.38ms | 66.487 | 71.875 | 5.39ms | 5.83ms |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| comparePngBuffersIdentical | 1.24ms | 100ms | PASS |
| comparePngBuffersFullDiff | 26.51ms | 400ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| comparePngBuffersIdentical | 17792 B | 2256609 B | 8388608 B | yes | PASS |
| comparePngBuffersFullDiff | 39936 B | 16882161 B | 16777216 B | yes | WAIVED (arrayBuffers の振れ幅 26MB が上限 16.7MB を上回り判定が成立しない (#1719)) |

## Detailed serial reports

### comparePngBuffersIdentical

# Perf Report — comparePngBuffersIdentical.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.32ms |
| p50 | 0.39ms |
| p95 | 0.61ms |
| p99 | 0.68ms |
| mean | 0.41ms |
| stdev | 0.10ms |
| min | 0.28ms |
| max | 0.70ms |
| total | 12.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.32ms | 0.37ms | -0.06ms | -14.91% |
| p50 | 0.39ms | 0.46ms | -0.07ms | -14.95% |
| p95 | 0.61ms | 0.89ms | -0.28ms | -32.02% |
| p99 | 0.68ms | 0.92ms | -0.24ms | -26.09% |
| mean | 0.41ms | 0.51ms | -0.10ms | -20.38% |
| min | 0.28ms | 0.32ms | -0.04ms | -11.54% |
| max | 0.70ms | 0.92ms | -0.23ms | -24.42% |
| total | 12.16ms | 15.27ms | -3.11ms | -20.38% |

### comparePngBuffersFullDiff

# Perf Report — comparePngBuffersFullDiff.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 5.38ms |
| p50 | 6.02ms |
| p95 | 7.80ms |
| p99 | 7.99ms |
| mean | 6.29ms |
| stdev | 0.78ms |
| min | 5.28ms |
| max | 8.01ms |
| total | 188.75ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 5.38ms | 5.83ms | -0.44ms | -7.61% |
| p50 | 6.02ms | 6.45ms | -0.44ms | -6.79% |
| p95 | 7.80ms | 8.40ms | -0.61ms | -7.21% |
| p99 | 7.99ms | 8.80ms | -0.80ms | -9.15% |
| mean | 6.29ms | 6.71ms | -0.42ms | -6.25% |
| min | 5.28ms | 5.68ms | -0.40ms | -7.08% |
| max | 8.01ms | 8.87ms | -0.87ms | -9.78% |
| total | 188.75ms | 201.33ms | -12.58ms | -6.25% |

