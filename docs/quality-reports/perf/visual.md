# Perf Suite — visual

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| comparePngBuffersIdentical | 0.42ms | 0.83ms | 50ms | 0.00044ms | PASS | stable — gate 無効 (regressionGate=false) |
| comparePngBuffersFullDiff | 6.22ms | 9.01ms | 200ms | 0.00044ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| comparePngBuffersIdentical | cpu | 0.09ms | 0.10ms | 0.42ms | 4.673 | 4.255 | 0.38ms | 0.34ms |
| comparePngBuffersFullDiff | cpu | 0.09ms | 0.10ms | 6.22ms | 68.770 | 65.521 | 5.59ms | 5.32ms |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| comparePngBuffersIdentical | 1.59ms | 100ms | PASS |
| comparePngBuffersFullDiff | 32.47ms | 400ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| comparePngBuffersIdentical | 20064 B | 2104945 B | 8388608 B | yes | PASS |
| comparePngBuffersFullDiff | 30568 B | -3691185 B | 16777216 B | yes | WAIVED (arrayBuffers の振れ幅 26MB が上限 16.7MB を上回り判定が成立しない (#1719)) |

## Detailed serial reports

### comparePngBuffersIdentical

# Perf Report — comparePngBuffersIdentical.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.42ms |
| p50 | 0.48ms |
| p95 | 0.83ms |
| p99 | 0.92ms |
| mean | 0.55ms |
| stdev | 0.15ms |
| min | 0.36ms |
| max | 0.94ms |
| total | 16.42ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.903)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.38ms | 0.34ms | +0.03ms | +9.82% |
| p50 | 0.44ms | 0.40ms | +0.03ms | +7.69% |
| p95 | 0.75ms | 0.68ms | +0.07ms | +10.21% |
| p99 | 0.83ms | 0.80ms | +0.03ms | +3.93% |
| mean | 0.49ms | 0.46ms | +0.04ms | +8.45% |
| min | 0.33ms | 0.33ms | -0.0057ms | -1.72% |
| max | 0.85ms | 0.83ms | +0.01ms | +1.52% |
| total | 14.83ms | 13.68ms | +1.16ms | +8.45% |

### comparePngBuffersFullDiff

# Perf Report — comparePngBuffersFullDiff.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 6.22ms |
| p50 | 7.30ms |
| p95 | 9.01ms |
| p99 | 9.97ms |
| mean | 7.42ms |
| stdev | 1.05ms |
| min | 6.09ms |
| max | 10.33ms |
| total | 222.74ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.898)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 5.59ms | 5.32ms | +0.26ms | +4.96% |
| p50 | 6.55ms | 6.11ms | +0.45ms | +7.31% |
| p95 | 8.09ms | 7.81ms | +0.28ms | +3.56% |
| p99 | 8.95ms | 8.31ms | +0.65ms | +7.77% |
| mean | 6.67ms | 6.27ms | +0.40ms | +6.39% |
| min | 5.47ms | 5.17ms | +0.30ms | +5.79% |
| max | 9.28ms | 8.46ms | +0.82ms | +9.64% |
| total | 200.04ms | 188.03ms | +12.01ms | +6.39% |

