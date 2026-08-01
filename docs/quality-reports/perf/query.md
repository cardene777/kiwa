# Perf Suite — query

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| fetchQuery | 0.00042ms | 0.0028ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| mutate | 0.00063ms | 0.0038ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invalidateQuery | 0.00029ms | 0.00063ms | 5ms | 0.00032ms | PASS | stable (検知には +0.00032ms (baseline 比 +128%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| fetchQuery | cpu | 0.08ms | 0.08ms | 0.00042ms | 0.005 | 0.006 | n/a | 20.0% | 0.00042ms | 0.00046ms |
| mutate | cpu | 0.08ms | 0.09ms | 0.00063ms | 0.008 | 0.008 | n/a | 20.0% | 0.00063ms | 0.00063ms |
| invalidateQuery | cpu | 0.08ms | 0.09ms | 0.00029ms | 0.004 | 0.003 | n/a | 20.0% | 0.00028ms | 0.00025ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| fetchQuery | 0.02ms | 10ms | PASS |
| mutate | 0.02ms | 10ms | PASS |
| invalidateQuery | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| fetchQuery | -15048 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| mutate | -16488 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| invalidateQuery | 2656 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### fetchQuery

# Perf Report — fetchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.0028ms |
| p99 | 0.0098ms |
| mean | 0.00094ms |
| stdev | 0.0016ms |
| min | 0.00038ms |
| max | 0.01ms |
| total | 0.19ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.997)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00046ms | -0.000042ms | -9.19% |
| p50 | 0.00046ms | 0.00050ms | -0.000042ms | -8.44% |
| p95 | 0.0028ms | 0.0043ms | -0.0016ms | -36.70% |
| p99 | 0.0098ms | 0.01ms | -0.0015ms | -12.93% |
| mean | 0.00094ms | 0.0011ms | -0.00014ms | -12.94% |
| min | 0.00037ms | 0.00042ms | -0.000042ms | -10.09% |
| max | 0.01ms | 0.01ms | -0.0015ms | -10.73% |
| total | 0.19ms | 0.22ms | -0.03ms | -12.94% |

### mutate

# Perf Report — mutate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00063ms |
| p50 | 0.00067ms |
| p95 | 0.0038ms |
| p99 | 0.02ms |
| mean | 0.0014ms |
| stdev | 0.0034ms |
| min | 0.00058ms |
| max | 0.03ms |
| total | 0.28ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.005)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00063ms | 0.00063ms | +0.0000032ms | +0.51% |
| p50 | 0.00067ms | 0.00071ms | -0.000038ms | -5.31% |
| p95 | 0.0038ms | 0.0041ms | -0.00038ms | -9.16% |
| p99 | 0.02ms | 0.02ms | +0.0020ms | +11.74% |
| mean | 0.0014ms | 0.0015ms | -0.00011ms | -7.40% |
| min | 0.00059ms | 0.00058ms | +0.0000030ms | +0.51% |
| max | 0.04ms | 0.04ms | -0.0011ms | -2.96% |
| total | 0.28ms | 0.31ms | -0.02ms | -7.40% |

### invalidateQuery

# Perf Report — invalidateQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00063ms |
| p99 | 0.0043ms |
| mean | 0.00060ms |
| stdev | 0.0020ms |
| min | 0.00029ms |
| max | 0.02ms |
| total | 0.12ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.962)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00028ms | 0.00025ms | +0.000031ms | +12.34% |
| p50 | 0.00032ms | 0.00029ms | +0.000028ms | +9.68% |
| p95 | 0.00061ms | 0.00054ms | +0.000063ms | +11.64% |
| p99 | 0.0041ms | 0.0066ms | -0.0025ms | -37.51% |
| mean | 0.00058ms | 0.00056ms | +0.000022ms | +4.05% |
| min | 0.00028ms | 0.00025ms | +0.000030ms | +11.95% |
| max | 0.02ms | 0.02ms | +0.0027ms | +14.76% |
| total | 0.12ms | 0.11ms | +0.0045ms | +4.05% |

