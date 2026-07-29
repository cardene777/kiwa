# Perf Suite — data

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| queueSend | 0.00021ms | 0.0015ms | 5ms | 0.00037ms | PASS | stable (差 0.00014ms が下限 0.00037ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| fakeClockAdvance | 0.00029ms | 0.00097ms | 5ms | 0.00034ms | PASS | stable (検知には +0.00034ms (baseline 比 +103%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| queueSend | cpu | 0.08ms | 0.00021ms | 0.003 | 0.004 | 0.00023ms | 0.00038ms |
| fakeClockAdvance | cpu | 0.08ms | 0.00029ms | 0.004 | 0.004 | 0.00030ms | 0.00033ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| queueSend | 0.01ms | 10ms | PASS |
| fakeClockAdvance | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| queueSend | 32216 B | -28590 B | 102400 B | yes | PASS |
| fakeClockAdvance | 648 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### queueSend

# Perf Report — queueSend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00025ms |
| p95 | 0.0015ms |
| p99 | 0.0087ms |
| mean | 0.00054ms |
| stdev | 0.0013ms |
| min | 0.00021ms |
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00038ms | -0.00017ms | -44.53% |
| p50 | 0.00025ms | 0.00063ms | -0.00038ms | -60.00% |
| p95 | 0.0015ms | 0.0091ms | -0.0075ms | -82.99% |
| p99 | 0.0087ms | 0.04ms | -0.03ms | -77.13% |
| mean | 0.00054ms | 0.01ms | -0.01ms | -96.05% |
| min | 0.00021ms | 0.00033ms | -0.00013ms | -37.54% |
| max | 0.01ms | 2.13ms | -2.12ms | -99.47% |
| total | 0.11ms | 2.74ms | -2.63ms | -96.05% |

### fakeClockAdvance

# Perf Report — fakeClockAdvance.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00097ms |
| p99 | 0.0042ms |
| mean | 0.00051ms |
| stdev | 0.00076ms |
| min | 0.00029ms |
| max | 0.0071ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00033ms | -0.000041ms | -12.31% |
| p50 | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| p95 | 0.00097ms | 0.0044ms | -0.0034ms | -77.81% |
| p99 | 0.0042ms | 0.01ms | -0.0077ms | -64.84% |
| mean | 0.00051ms | 0.0014ms | -0.00085ms | -62.35% |
| min | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| max | 0.0071ms | 0.08ms | -0.08ms | -91.65% |
| total | 0.10ms | 0.27ms | -0.17ms | -62.35% |

