# Perf Suite — trpc

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeProcedure_query | 0.00054ms | 0.0050ms | 5ms | 0.00037ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeProcedure_mutation | 0.00050ms | 0.0015ms | 5ms | 0.00037ms | PASS | stable — gate 無効 (regressionGate=false) |
| client_query | 0.00058ms | 0.01ms | 5ms | 0.00037ms | PASS | stable (換算後 p10 +3% (閾値未満)、 p95 +50% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| invokeProcedure_query | cpu | 0.09ms | 0.10ms | 0.00054ms | 0.006 | 0.006 | 0.00049ms | 0.00046ms |
| invokeProcedure_mutation | cpu | 0.09ms | 0.09ms | 0.00050ms | 0.005 | 0.006 | 0.00044ms | 0.00046ms |
| client_query | cpu | 0.09ms | 0.13ms | 0.00058ms | 0.006 | 0.006 | 0.00052ms | 0.00050ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeProcedure_query | 0.02ms | 10ms | PASS |
| invokeProcedure_mutation | 0.01ms | 10ms | PASS |
| client_query | 0.03ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeProcedure_query | -5992 B | 0 B | 102400 B | yes | PASS |
| invokeProcedure_mutation | 568 B | 0 B | 102400 B | yes | PASS |
| client_query | 1568 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeProcedure_query

# Perf Report — invokeProcedure_query.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00063ms |
| p95 | 0.0050ms |
| p99 | 0.01ms |
| mean | 0.0014ms |
| stdev | 0.0025ms |
| min | 0.00050ms |
| max | 0.02ms |
| total | 0.29ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.899)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00049ms | 0.00046ms | +0.000029ms | +6.40% |
| p50 | 0.00056ms | 0.00050ms | +0.000062ms | +12.39% |
| p95 | 0.0045ms | 0.0045ms | -0.0000025ms | -0.06% |
| p99 | 0.01ms | 0.01ms | -0.0017ms | -12.78% |
| mean | 0.0013ms | 0.0013ms | +0.000027ms | +2.17% |
| min | 0.00045ms | 0.00042ms | +0.000034ms | +8.07% |
| max | 0.02ms | 0.02ms | +0.0016ms | +9.76% |
| total | 0.26ms | 0.25ms | +0.0055ms | +2.17% |

### invokeProcedure_mutation

# Perf Report — invokeProcedure_mutation.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00058ms |
| p95 | 0.0015ms |
| p99 | 0.0079ms |
| mean | 0.00088ms |
| stdev | 0.0017ms |
| min | 0.00046ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.880)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00044ms | 0.00046ms | -0.000018ms | -3.94% |
| p50 | 0.00051ms | 0.00050ms | +0.000013ms | +2.60% |
| p95 | 0.0013ms | 0.0011ms | +0.00020ms | +18.70% |
| p99 | 0.0070ms | 0.0039ms | +0.0031ms | +78.37% |
| mean | 0.00078ms | 0.00082ms | -0.000041ms | -5.03% |
| min | 0.00040ms | 0.00042ms | -0.000014ms | -3.36% |
| max | 0.01ms | 0.03ms | -0.01ms | -43.52% |
| total | 0.16ms | 0.16ms | -0.0082ms | -5.03% |

### client_query

# Perf Report — client_query.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.00067ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0018ms |
| stdev | 0.0039ms |
| min | 0.00054ms |
| max | 0.03ms |
| total | 0.36ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.884)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00052ms | 0.00050ms | +0.000016ms | +3.11% |
| p50 | 0.00059ms | 0.00058ms | +0.0000068ms | +1.17% |
| p95 | 0.0096ms | 0.0064ms | +0.0032ms | +50.42% |
| p99 | 0.02ms | 0.02ms | -0.0054ms | -23.76% |
| mean | 0.0016ms | 0.0018ms | -0.00019ms | -10.98% |
| min | 0.00048ms | 0.00042ms | +0.000063ms | +15.21% |
| max | 0.02ms | 0.03ms | -0.0045ms | -15.38% |
| total | 0.31ms | 0.35ms | -0.04ms | -10.98% |

