# Perf Suite — dapp

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| eventEmitterEmit | 0.00021ms | 0.00046ms | 5ms | 0.00035ms | PASS | stable (検知には +0.00035ms (baseline 比 +166%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| anvilKeyLookup | 0.00017ms | 0.0027ms | 5ms | 0.00031ms | PASS | stable (検知には +0.00031ms (baseline 比 +192%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| eventEmitterEmit | cpu | 0.08ms | 0.09ms | 0.00021ms | 0.003 | 0.003 | 0.00022ms | 0.00021ms |
| anvilKeyLookup | cpu | 0.09ms | 0.12ms | 0.00017ms | 0.002 | 0.002 | 0.00016ms | 0.00016ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| eventEmitterEmit | 0.01ms | 10ms | PASS |
| anvilKeyLookup | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| eventEmitterEmit | -37360 B | 0 B | 102400 B | yes | PASS |
| anvilKeyLookup | 5928 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### eventEmitterEmit

# Perf Report — eventEmitterEmit.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00021ms |
| p95 | 0.00046ms |
| p99 | 0.0046ms |
| mean | 0.00036ms |
| stdev | 0.00076ms |
| min | 0.00017ms |
| max | 0.0073ms |
| total | 0.07ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.042)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00022ms | 0.00021ms | +0.0000088ms | +4.25% |
| p50 | 0.00022ms | 0.00025ms | -0.000032ms | -12.85% |
| p95 | 0.00048ms | 0.0023ms | -0.0018ms | -78.51% |
| p99 | 0.0048ms | 0.0082ms | -0.0033ms | -40.86% |
| mean | 0.00038ms | 0.00060ms | -0.00023ms | -37.37% |
| min | 0.00017ms | 0.00017ms | +0.0000071ms | +4.25% |
| max | 0.0076ms | 0.01ms | -0.0055ms | -42.05% |
| total | 0.08ms | 0.12ms | -0.05ms | -37.37% |

### anvilKeyLookup

# Perf Report — anvilKeyLookup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.0027ms |
| p99 | 0.0061ms |
| mean | 0.00053ms |
| stdev | 0.0012ms |
| min | 0.00017ms |
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.938)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00016ms | 0.00016ms | -0.0000061ms | -3.79% |
| p50 | 0.00020ms | 0.00017ms | +0.000028ms | +16.87% |
| p95 | 0.0025ms | 0.00034ms | +0.0022ms | +643.47% |
| p99 | 0.0057ms | 0.0037ms | +0.0020ms | +54.96% |
| mean | 0.00050ms | 0.00026ms | +0.00024ms | +89.28% |
| min | 0.00016ms | 0.00013ms | +0.000031ms | +24.61% |
| max | 0.0095ms | 0.0060ms | +0.0035ms | +59.43% |
| total | 0.10ms | 0.05ms | +0.05ms | +89.28% |

