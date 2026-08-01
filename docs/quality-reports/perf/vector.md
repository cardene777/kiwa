# Perf Suite — vector

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| upsertInsert | 0.0013ms | 0.0074ms | 5ms | 0.00050ms | PASS | n/a (baseline seeded) — gate 無効 (regressionGate=false) |
| upsertUpdate | 0.00075ms | 0.00096ms | 5ms | 0.00050ms | PASS | n/a (baseline seeded) — gate 無効 (regressionGate=false) |
| queryNearestTop5 | 0.02ms | 0.05ms | 5ms | 0.00046ms | PASS | regressed — gate 無効 (regressionGate=false) |
| fetchById | 0.00021ms | 0.0020ms | 5ms | 0.00046ms | PASS | stable (検知には +0.00046ms (baseline 比 +223%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| upsertInsert | cpu | 0.09ms | 0.10ms | 0.0013ms | 0.014 | n/a | n/a | n/a | n/a | n/a |
| upsertUpdate | cpu | 0.09ms | 0.09ms | 0.00075ms | 0.008 | n/a | n/a | n/a | n/a | n/a |
| queryNearestTop5 | cpu | 0.09ms | 0.10ms | 0.02ms | 0.274 | 0.045 | n/a | 20.0% | 0.02ms | 0.0037ms |
| fetchById | cpu | 0.09ms | 0.11ms | 0.00021ms | 0.002 | 0.003 | n/a | 20.0% | 0.00019ms | 0.00021ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| upsertInsert | 0.02ms | 10ms | PASS |
| upsertUpdate | 0.02ms | 10ms | PASS |
| queryNearestTop5 | 0.28ms | 10ms | PASS |
| fetchById | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| upsertInsert | 152952 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| upsertUpdate | -16200 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| queryNearestTop5 | 2688 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| fetchById | 744 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### upsertInsert

# Perf Report — upsertInsert.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0013ms |
| p50 | 0.0016ms |
| p95 | 0.0074ms |
| p99 | 0.01ms |
| mean | 0.0099ms |
| stdev | 0.11ms |
| min | 0.0011ms |
| max | 1.55ms |
| total | 1.99ms |

### upsertUpdate

# Perf Report — upsertUpdate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00075ms |
| p50 | 0.00079ms |
| p95 | 0.00096ms |
| p99 | 0.0025ms |
| mean | 0.00087ms |
| stdev | 0.00045ms |
| min | 0.00071ms |
| max | 0.0064ms |
| total | 0.17ms |

### queryNearestTop5

# Perf Report — queryNearestTop5.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.03ms |
| p95 | 0.05ms |
| p99 | 0.06ms |
| mean | 0.03ms |
| stdev | 0.0086ms |
| min | 0.02ms |
| max | 0.10ms |
| total | 5.63ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.917)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.0037ms | +0.02ms | +509.28% |
| p50 | 0.02ms | 0.0039ms | +0.02ms | +509.17% |
| p95 | 0.04ms | 0.0089ms | +0.03ms | +371.35% |
| p99 | 0.06ms | 0.02ms | +0.04ms | +242.75% |
| mean | 0.03ms | 0.0048ms | +0.02ms | +436.18% |
| min | 0.02ms | 0.0036ms | +0.02ms | +484.65% |
| max | 0.09ms | 0.02ms | +0.07ms | +283.62% |
| total | 5.16ms | 0.96ms | +4.20ms | +436.18% |

### fetchById

# Perf Report — fetchById.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00025ms |
| p95 | 0.0020ms |
| p99 | 0.0049ms |
| mean | 0.00048ms |
| stdev | 0.00086ms |
| min | 0.00021ms |
| max | 0.0064ms |
| total | 0.10ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.927)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00019ms | 0.00021ms | -0.000014ms | -6.81% |
| p50 | 0.00023ms | 0.00025ms | -0.000018ms | -7.26% |
| p95 | 0.0019ms | 0.00042ms | +0.0015ms | +346.27% |
| p99 | 0.0046ms | 0.0035ms | +0.0011ms | +31.73% |
| mean | 0.00044ms | 0.00043ms | +0.000010ms | +2.40% |
| min | 0.00019ms | 0.00017ms | +0.000027ms | +16.20% |
| max | 0.0059ms | 0.02ms | -0.01ms | -71.45% |
| total | 0.09ms | 0.09ms | +0.0021ms | +2.40% |

