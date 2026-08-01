# Perf Suite — state

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00042ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00083ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| createStore | 0.00025ms | 0.0048ms | 5ms | 0.00072ms | PASS | stable (検知には +0.00072ms (baseline 比 +345%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| dispatch | 0.00038ms | 0.0087ms | 5ms | 0.00071ms | PASS | stable (検知には +0.00071ms (baseline 比 +243%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| selectState | 0.00021ms | 0.0060ms | 5ms | 0.00072ms | PASS | stable (検知には +0.00072ms (baseline 比 +345%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| createStore | cpu | 0.09ms | 0.12ms | 0.00025ms | 0.003 | 0.003 | n/a | 20.0% | 0.00021ms | 0.00021ms |
| dispatch | cpu | 0.09ms | 0.14ms | 0.00038ms | 0.004 | 0.004 | n/a | 20.0% | 0.00032ms | 0.00029ms |
| selectState | cpu | 0.09ms | 0.16ms | 0.00021ms | 0.002 | 0.003 | n/a | 20.0% | 0.00018ms | 0.00021ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createStore | 0.01ms | 10ms | PASS |
| dispatch | 0.01ms | 10ms | PASS |
| selectState | 0.06ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| createStore | -14968 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| dispatch | -102984 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| selectState | 2592 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### createStore

# Perf Report — createStore.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00029ms |
| p95 | 0.0048ms |
| p99 | 0.0086ms |
| mean | 0.0011ms |
| stdev | 0.0028ms |
| min | 0.00025ms |
| max | 0.03ms |
| total | 0.22ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.860)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00021ms | +0.0000069ms | +3.34% |
| p50 | 0.00025ms | 0.00025ms | +0.0000011ms | +0.42% |
| p95 | 0.0041ms | 0.0021ms | +0.0020ms | +92.28% |
| p99 | 0.0074ms | 0.0072ms | +0.00019ms | +2.67% |
| mean | 0.00093ms | 0.00059ms | +0.00035ms | +59.42% |
| min | 0.00021ms | 0.00021ms | +0.0000069ms | +3.34% |
| max | 0.03ms | 0.01ms | +0.01ms | +99.81% |
| total | 0.19ms | 0.12ms | +0.07ms | +59.42% |

### dispatch

# Perf Report — dispatch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00038ms |
| p95 | 0.0087ms |
| p99 | 0.02ms |
| mean | 0.0017ms |
| stdev | 0.0053ms |
| min | 0.00033ms |
| max | 0.05ms |
| total | 0.33ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.852)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00032ms | 0.00029ms | +0.000028ms | +9.47% |
| p50 | 0.00032ms | 0.00033ms | -0.000014ms | -4.29% |
| p95 | 0.0075ms | 0.00085ms | +0.0066ms | +774.65% |
| p99 | 0.02ms | 0.0080ms | +0.0081ms | +102.24% |
| mean | 0.0014ms | 0.00059ms | +0.00082ms | +138.15% |
| min | 0.00028ms | 0.00029ms | -0.0000071ms | -2.45% |
| max | 0.05ms | 0.01ms | +0.03ms | +307.02% |
| total | 0.28ms | 0.12ms | +0.16ms | +138.15% |

### selectState

# Perf Report — selectState.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00025ms |
| p95 | 0.0060ms |
| p99 | 0.01ms |
| mean | 0.0033ms |
| stdev | 0.03ms |
| min | 0.00021ms |
| max | 0.48ms |
| total | 0.67ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.861)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00018ms | 0.00021ms | -0.000028ms | -13.44% |
| p50 | 0.00022ms | 0.00021ms | +0.0000074ms | +3.54% |
| p95 | 0.0051ms | 0.0011ms | +0.0041ms | +373.49% |
| p99 | 0.0096ms | 0.0053ms | +0.0043ms | +80.71% |
| mean | 0.0029ms | 0.00044ms | +0.0024ms | +548.65% |
| min | 0.00018ms | 0.00017ms | +0.000013ms | +7.94% |
| max | 0.41ms | 0.02ms | +0.40ms | +2518.23% |
| total | 0.58ms | 0.09ms | +0.49ms | +548.65% |

