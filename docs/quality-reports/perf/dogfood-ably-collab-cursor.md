# Perf Suite — dogfood-ably-collab-cursor

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| joinBoard | 0.0018ms | 0.01ms | 50ms | 0.00041ms | PASS | stable (差 0.00038ms が下限 0.00041ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| moveCursor | 10.07ms | 10.40ms | 100ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |
| rewindHistory | 0.00088ms | 0.02ms | 30ms | 0.00040ms | PASS | stable (換算後 p10 +13% (閾値未満)、 p95 +42% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| getPresence | 0.00054ms | 0.02ms | 30ms | 0.00041ms | PASS | stable (換算後 p10 +16% (閾値未満)、 p95 +298% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| joinBoard | cpu | 0.08ms | 0.09ms | 0.0018ms | 0.022 | 0.017 | 0.0018ms | 0.0014ms |
| moveCursor | cpu | 0.08ms | 0.09ms | 10.07ms | 121.218 | 127.633 | 9.89ms | 10.41ms |
| rewindHistory | cpu | 0.08ms | 0.14ms | 0.00088ms | 0.011 | 0.009 | 0.00085ms | 0.00075ms |
| getPresence | cpu | 0.08ms | 0.36ms | 0.00054ms | 0.007 | 0.006 | 0.00053ms | 0.00046ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| joinBoard | 0.03ms | 100ms | PASS |
| moveCursor | 10.48ms | 200ms | PASS |
| rewindHistory | 0.07ms | 60ms | PASS |
| getPresence | 0.01ms | 60ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| joinBoard | 23328 B | 0 B | 102400 B | yes | PASS |
| moveCursor | 49344 B | 0 B | 102400 B | yes | PASS |
| rewindHistory | 37024 B | 0 B | 102400 B | yes | PASS |
| getPresence | 47104 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### joinBoard

# Perf Report — joinBoard.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0018ms |
| p50 | 0.0024ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0046ms |
| stdev | 0.0056ms |
| min | 0.0015ms |
| max | 0.03ms |
| total | 0.18ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.995)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0018ms | 0.0014ms | +0.00038ms | +27.02% |
| p50 | 0.0024ms | 0.0023ms | +0.00015ms | +6.76% |
| p95 | 0.01ms | 0.01ms | -0.0015ms | -11.68% |
| p99 | 0.03ms | 0.03ms | -0.0013ms | -4.76% |
| mean | 0.0046ms | 0.0048ms | -0.00025ms | -5.11% |
| min | 0.0015ms | 0.0013ms | +0.00012ms | +8.74% |
| max | 0.03ms | 0.03ms | -0.0014ms | -4.05% |
| total | 0.18ms | 0.19ms | -0.0098ms | -5.11% |

### moveCursor

# Perf Report — moveCursor.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 10.07ms |
| p50 | 10.34ms |
| p95 | 10.40ms |
| p99 | 10.45ms |
| mean | 10.23ms |
| stdev | 0.34ms |
| min | 8.95ms |
| max | 10.47ms |
| total | 409.17ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.983)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 9.89ms | 10.41ms | -0.52ms | -5.03% |
| p50 | 10.16ms | 11.41ms | -1.25ms | -10.95% |
| p95 | 10.22ms | 11.49ms | -1.27ms | -11.06% |
| p99 | 10.26ms | 11.55ms | -1.28ms | -11.11% |
| mean | 10.05ms | 11.21ms | -1.16ms | -10.37% |
| min | 8.79ms | 9.42ms | -0.63ms | -6.69% |
| max | 10.29ms | 11.56ms | -1.27ms | -10.96% |
| total | 402.03ms | 448.56ms | -46.54ms | -10.37% |

### rewindHistory

# Perf Report — rewindHistory.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00088ms |
| p50 | 0.0024ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0049ms |
| stdev | 0.0061ms |
| min | 0.00083ms |
| max | 0.03ms |
| total | 0.19ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.971)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00085ms | 0.00075ms | +0.00010ms | +13.33% |
| p50 | 0.0023ms | 0.00088ms | +0.0015ms | +165.99% |
| p95 | 0.02ms | 0.01ms | +0.0046ms | +41.57% |
| p99 | 0.02ms | 0.02ms | +0.0052ms | +26.60% |
| mean | 0.0047ms | 0.0027ms | +0.0020ms | +74.26% |
| min | 0.00081ms | 0.00071ms | +0.00010ms | +14.29% |
| max | 0.03ms | 0.02ms | +0.0022ms | +9.16% |
| total | 0.19ms | 0.11ms | +0.08ms | +74.26% |

### getPresence

# Perf Report — getPresence.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.0015ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0051ms |
| stdev | 0.0071ms |
| min | 0.00054ms |
| max | 0.03ms |
| total | 0.20ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.982)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00053ms | 0.00046ms | +0.000074ms | +16.26% |
| p50 | 0.0015ms | 0.00054ms | +0.00097ms | +179.67% |
| p95 | 0.02ms | 0.0041ms | +0.01ms | +297.79% |
| p99 | 0.03ms | 0.01ms | +0.02ms | +149.80% |
| mean | 0.0050ms | 0.0013ms | +0.0037ms | +296.37% |
| min | 0.00053ms | 0.00046ms | +0.000073ms | +16.05% |
| max | 0.03ms | 0.01ms | +0.02ms | +178.06% |
| total | 0.20ms | 0.05ms | +0.15ms | +296.37% |

