# Perf Suite — data

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| queueSend | 0.00025ms | 0.0021ms | 5ms | 0.00030ms | PASS | stable (差 0.00011ms が下限 0.00030ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| fakeClockAdvance | 0.00033ms | 0.00092ms | 5ms | 0.00030ms | PASS | stable (検知には +0.00030ms (baseline 比 +103%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| queueSend | cpu | 0.09ms | 0.09ms | 0.00025ms | 0.003 | 0.004 | n/a | 20.0% | 0.00023ms | 0.00033ms |
| fakeClockAdvance | cpu | 0.09ms | 0.09ms | 0.00033ms | 0.004 | 0.004 | n/a | 20.0% | 0.00030ms | 0.00029ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| queueSend | 0.01ms | 10ms | PASS |
| fakeClockAdvance | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| queueSend | 27832 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| fakeClockAdvance | 8912 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### queueSend

# Perf Report — queueSend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00025ms |
| p95 | 0.0021ms |
| p99 | 0.0084ms |
| mean | 0.00065ms |
| stdev | 0.0016ms |
| min | 0.00025ms |
| max | 0.01ms |
| total | 0.13ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.908)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00023ms | 0.00033ms | -0.00011ms | -31.83% |
| p50 | 0.00023ms | 0.00038ms | -0.00015ms | -39.46% |
| p95 | 0.0019ms | 0.0036ms | -0.0017ms | -47.94% |
| p99 | 0.0076ms | 0.0092ms | -0.0016ms | -17.11% |
| mean | 0.00059ms | 0.00095ms | -0.00036ms | -38.01% |
| min | 0.00023ms | 0.00029ms | -0.000064ms | -21.99% |
| max | 0.01ms | 0.02ms | -0.01ms | -56.83% |
| total | 0.12ms | 0.19ms | -0.07ms | -38.01% |

### fakeClockAdvance

# Perf Report — fakeClockAdvance.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.00092ms |
| p99 | 0.0042ms |
| mean | 0.00058ms |
| stdev | 0.00096ms |
| min | 0.00033ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.902)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00030ms | 0.00029ms | +0.0000085ms | +2.92% |
| p50 | 0.00034ms | 0.00033ms | +0.0000044ms | +1.32% |
| p95 | 0.00083ms | 0.0025ms | -0.0017ms | -67.04% |
| p99 | 0.0038ms | 0.0094ms | -0.0057ms | -60.25% |
| mean | 0.00053ms | 0.00073ms | -0.00020ms | -27.47% |
| min | 0.00030ms | 0.00029ms | +0.0000095ms | +3.27% |
| max | 0.0093ms | 0.02ms | -0.0090ms | -49.13% |
| total | 0.11ms | 0.15ms | -0.04ms | -27.47% |

