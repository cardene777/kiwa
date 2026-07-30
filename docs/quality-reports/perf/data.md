# Perf Suite — data

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| queueSend | 0.00033ms | 0.0041ms | 5ms | 0.00041ms | PASS | stable (検知には +0.00041ms (baseline 比 +124%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| fakeClockAdvance | 0.00033ms | 0.00079ms | 5ms | 0.00041ms | PASS | stable (検知には +0.00041ms (baseline 比 +142%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| queueSend | cpu | 0.08ms | 0.09ms | 0.00033ms | 0.004 | 0.004 | 0.00033ms | 0.00033ms |
| fakeClockAdvance | cpu | 0.08ms | 0.09ms | 0.00033ms | 0.004 | 0.004 | 0.00033ms | 0.00029ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| queueSend | 0.01ms | 10ms | PASS |
| fakeClockAdvance | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| queueSend | 29560 B | 0 B | 102400 B | yes | PASS |
| fakeClockAdvance | -2464 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### queueSend

# Perf Report — queueSend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.0041ms |
| p99 | 0.01ms |
| mean | 0.0011ms |
| stdev | 0.0033ms |
| min | 0.00029ms |
| max | 0.04ms |
| total | 0.22ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.992)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | -0.0000027ms | -0.82% |
| p50 | 0.00037ms | 0.00038ms | -0.0000031ms | -0.82% |
| p95 | 0.0041ms | 0.0036ms | +0.00050ms | +13.99% |
| p99 | 0.01ms | 0.0092ms | +0.0019ms | +20.56% |
| mean | 0.0011ms | 0.00095ms | +0.00016ms | +17.40% |
| min | 0.00029ms | 0.00029ms | -0.0000024ms | -0.82% |
| max | 0.04ms | 0.02ms | +0.01ms | +49.13% |
| total | 0.22ms | 0.19ms | +0.03ms | +17.40% |

### fakeClockAdvance

# Perf Report — fakeClockAdvance.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00033ms |
| p95 | 0.00079ms |
| p99 | 0.0038ms |
| mean | 0.00048ms |
| stdev | 0.00071ms |
| min | 0.00029ms |
| max | 0.0088ms |
| total | 0.10ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.995)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00029ms | +0.000039ms | +13.51% |
| p50 | 0.00033ms | 0.00033ms | -0.0000016ms | -0.46% |
| p95 | 0.00079ms | 0.0025ms | -0.0017ms | -68.68% |
| p99 | 0.0038ms | 0.0094ms | -0.0057ms | -59.95% |
| mean | 0.00047ms | 0.00073ms | -0.00025ms | -34.58% |
| min | 0.00029ms | 0.00029ms | -0.0000014ms | -0.46% |
| max | 0.0088ms | 0.02ms | -0.0096ms | -52.27% |
| total | 0.09ms | 0.15ms | -0.05ms | -34.58% |

