# Perf Suite — vector

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| upsertOne | 0.00088ms | 0.0061ms | 5ms | 0.00031ms | PASS | stable (換算後 p10 +4% (閾値未満)、 p95 +78% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| queryNearestTop5 | 0.0040ms | 0.02ms | 5ms | 0.00030ms | PASS | stable (換算後 p10 -1% (閾値未満)、 p95 +57% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| fetchById | 0.00025ms | 0.00050ms | 5ms | 0.00030ms | PASS | stable (検知には +0.00030ms (baseline 比 +146%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| upsertOne | cpu | 0.09ms | 0.12ms | 0.00088ms | 0.010 | 0.010 | 0.00082ms | 0.00079ms |
| queryNearestTop5 | cpu | 0.09ms | 0.11ms | 0.0040ms | 0.044 | 0.045 | 0.0037ms | 0.0037ms |
| fetchById | cpu | 0.09ms | 0.10ms | 0.00025ms | 0.003 | 0.003 | 0.00023ms | 0.00021ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| upsertOne | 0.02ms | 10ms | PASS |
| queryNearestTop5 | 0.08ms | 10ms | PASS |
| fetchById | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| upsertOne | -7808 B | 0 B | 102400 B | yes | PASS |
| queryNearestTop5 | -15984 B | 0 B | 102400 B | yes | PASS |
| fetchById | 648 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### upsertOne

# Perf Report — upsertOne.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00088ms |
| p50 | 0.0010ms |
| p95 | 0.0061ms |
| p99 | 0.02ms |
| mean | 0.0019ms |
| stdev | 0.0030ms |
| min | 0.00079ms |
| max | 0.02ms |
| total | 0.37ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.937)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00082ms | 0.00079ms | +0.000029ms | +3.65% |
| p50 | 0.00094ms | 0.00083ms | +0.00010ms | +12.35% |
| p95 | 0.0057ms | 0.0032ms | +0.0025ms | +77.68% |
| p99 | 0.02ms | 0.0092ms | +0.0077ms | +83.26% |
| mean | 0.0018ms | 0.0013ms | +0.00043ms | +32.49% |
| min | 0.00074ms | 0.00075ms | -0.0000079ms | -1.06% |
| max | 0.02ms | 0.02ms | +0.0026ms | +13.07% |
| total | 0.35ms | 0.27ms | +0.09ms | +32.49% |

### queryNearestTop5

# Perf Report — queryNearestTop5.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0040ms |
| p50 | 0.0042ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0059ms |
| stdev | 0.0044ms |
| min | 0.0039ms |
| max | 0.03ms |
| total | 1.18ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.916)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0037ms | 0.0037ms | -0.000045ms | -1.22% |
| p50 | 0.0039ms | 0.0039ms | -0.000022ms | -0.57% |
| p95 | 0.01ms | 0.0089ms | +0.0051ms | +57.11% |
| p99 | 0.02ms | 0.02ms | +0.0071ms | +41.62% |
| mean | 0.0054ms | 0.0048ms | +0.00059ms | +12.19% |
| min | 0.0036ms | 0.0036ms | +0.0000036ms | +0.10% |
| max | 0.03ms | 0.02ms | +0.0017ms | +6.93% |
| total | 1.08ms | 0.96ms | +0.12ms | +12.19% |

### fetchById

# Perf Report — fetchById.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00029ms |
| p95 | 0.00050ms |
| p99 | 0.0040ms |
| mean | 0.00051ms |
| stdev | 0.0017ms |
| min | 0.00021ms |
| max | 0.02ms |
| total | 0.10ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.918)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00023ms | 0.00021ms | +0.000021ms | +10.28% |
| p50 | 0.00027ms | 0.00025ms | +0.000017ms | +6.80% |
| p95 | 0.00046ms | 0.00042ms | +0.000038ms | +9.01% |
| p99 | 0.0037ms | 0.0035ms | +0.00018ms | +5.31% |
| mean | 0.00047ms | 0.00043ms | +0.000033ms | +7.71% |
| min | 0.00019ms | 0.00017ms | +0.000025ms | +14.97% |
| max | 0.02ms | 0.02ms | -0.00049ms | -2.34% |
| total | 0.09ms | 0.09ms | +0.0067ms | +7.71% |

