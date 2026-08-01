# Perf Suite — migration

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| runUp | 0.00038ms | 0.0028ms | 5ms | 0.00032ms | PASS | stable — gate 無効 (regressionGate=false) |
| diffSchema | 0.0010ms | 0.0069ms | 5ms | 0.00032ms | PASS | stable (換算後 p10 -3% (閾値未満)、 p95 +119% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| clientCreate | 0.00017ms | 0.0026ms | 5ms | 0.00032ms | PASS | stable (検知には +0.00032ms (baseline 比 +192%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| runUp | cpu | 0.09ms | 0.09ms | 0.00038ms | 0.004 | 0.004 | n/a | 20.0% | 0.00036ms | 0.00033ms |
| diffSchema | cpu | 0.09ms | 0.11ms | 0.0010ms | 0.012 | 0.012 | n/a | 20.0% | 0.00097ms | 0.0010ms |
| clientCreate | cpu | 0.09ms | 0.12ms | 0.00017ms | 0.002 | 0.002 | n/a | 20.0% | 0.00016ms | 0.00017ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| runUp | 0.02ms | 10ms | PASS |
| diffSchema | 0.02ms | 10ms | PASS |
| clientCreate | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| runUp | -9984 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| diffSchema | -15008 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| clientCreate | 1664 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### runUp

# Perf Report — runUp.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.0028ms |
| p99 | 0.0078ms |
| mean | 0.00072ms |
| stdev | 0.0012ms |
| min | 0.00038ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.960)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00036ms | 0.00033ms | +0.000027ms | +8.16% |
| p50 | 0.00040ms | 0.00042ms | -0.000016ms | -3.84% |
| p95 | 0.0027ms | 0.0031ms | -0.00041ms | -13.26% |
| p99 | 0.0075ms | 0.0096ms | -0.0021ms | -22.26% |
| mean | 0.00069ms | 0.0010ms | -0.00032ms | -31.50% |
| min | 0.00036ms | 0.00033ms | +0.000027ms | +8.16% |
| max | 0.0097ms | 0.02ms | -0.01ms | -53.32% |
| total | 0.14ms | 0.20ms | -0.06ms | -31.50% |

### diffSchema

# Perf Report — diffSchema.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0010ms |
| p95 | 0.0069ms |
| p99 | 0.03ms |
| mean | 0.0027ms |
| stdev | 0.01ms |
| min | 0.00092ms |
| max | 0.15ms |
| total | 0.53ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.971)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00097ms | 0.0010ms | -0.000033ms | -3.29% |
| p50 | 0.0010ms | 0.0011ms | -0.000071ms | -6.57% |
| p95 | 0.0067ms | 0.0031ms | +0.0036ms | +118.62% |
| p99 | 0.03ms | 0.02ms | +0.0066ms | +30.78% |
| mean | 0.0026ms | 0.0018ms | +0.00078ms | +43.35% |
| min | 0.00089ms | 0.00096ms | -0.000069ms | -7.15% |
| max | 0.15ms | 0.02ms | +0.12ms | +503.80% |
| total | 0.52ms | 0.36ms | +0.16ms | +43.35% |

### clientCreate

# Perf Report — clientCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.0026ms |
| p99 | 0.0059ms |
| mean | 0.00060ms |
| stdev | 0.0017ms |
| min | 0.00013ms |
| max | 0.02ms |
| total | 0.12ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.958)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00016ms | 0.00017ms | -0.0000070ms | -4.23% |
| p50 | 0.00020ms | 0.00021ms | -0.0000088ms | -4.23% |
| p95 | 0.0025ms | 0.00060ms | +0.0019ms | +317.66% |
| p99 | 0.0057ms | 0.0040ms | +0.0017ms | +41.70% |
| mean | 0.00058ms | 0.00043ms | +0.00015ms | +35.89% |
| min | 0.00012ms | 0.00013ms | -0.0000053ms | -4.23% |
| max | 0.02ms | 0.02ms | -0.0046ms | -19.23% |
| total | 0.12ms | 0.09ms | +0.03ms | +35.89% |

