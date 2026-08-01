# Perf Suite — date

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| addDays | 0.00021ms | 0.0049ms | 5ms | 0.00039ms | PASS | stable (検知には +0.00039ms (baseline 比 +155%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| formatDate | 0.00092ms | 0.0026ms | 5ms | 0.00039ms | PASS | stable — gate 無効 (regressionGate=false) |
| createDateClient | 0.00033ms | 0.00060ms | 5ms | 0.00038ms | PASS | stable (検知には +0.00038ms (baseline 比 +131%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| addDays | cpu | 0.09ms | 0.13ms | 0.00021ms | 0.002 | 0.003 | n/a | 20.0% | 0.00020ms | 0.00025ms |
| formatDate | cpu | 0.09ms | 0.09ms | 0.00092ms | 0.010 | 0.011 | n/a | 20.0% | 0.00085ms | 0.00092ms |
| createDateClient | cpu | 0.09ms | 0.09ms | 0.00033ms | 0.004 | 0.004 | n/a | 20.0% | 0.00030ms | 0.00029ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| addDays | 0.01ms | 10ms | PASS |
| formatDate | 0.02ms | 10ms | PASS |
| createDateClient | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| addDays | -22984 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| formatDate | -18120 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| createDateClient | 8728 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### addDays

# Perf Report — addDays.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00025ms |
| p95 | 0.0049ms |
| p99 | 0.01ms |
| mean | 0.0010ms |
| stdev | 0.0022ms |
| min | 0.00021ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.934)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00020ms | 0.00025ms | -0.000055ms | -21.94% |
| p50 | 0.00023ms | 0.00029ms | -0.000059ms | -20.05% |
| p95 | 0.0046ms | 0.0055ms | -0.00090ms | -16.45% |
| p99 | 0.01ms | 0.0097ms | +0.00048ms | +4.95% |
| mean | 0.00095ms | 0.0014ms | -0.00044ms | -31.63% |
| min | 0.00019ms | 0.00021ms | -0.000014ms | -6.62% |
| max | 0.02ms | 0.09ms | -0.07ms | -80.85% |
| total | 0.19ms | 0.28ms | -0.09ms | -31.63% |

### formatDate

# Perf Report — formatDate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00092ms |
| p50 | 0.0011ms |
| p95 | 0.0026ms |
| p99 | 0.02ms |
| mean | 0.0015ms |
| stdev | 0.0027ms |
| min | 0.00088ms |
| max | 0.02ms |
| total | 0.31ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.932)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00085ms | 0.00092ms | -0.000061ms | -6.69% |
| p50 | 0.0010ms | 0.0011ms | -0.000073ms | -6.75% |
| p95 | 0.0024ms | 0.01ms | -0.01ms | -83.15% |
| p99 | 0.02ms | 0.03ms | -0.01ms | -39.46% |
| mean | 0.0014ms | 0.0032ms | -0.0017ms | -54.76% |
| min | 0.00082ms | 0.00083ms | -0.000017ms | -2.10% |
| max | 0.02ms | 0.04ms | -0.02ms | -46.66% |
| total | 0.29ms | 0.63ms | -0.35ms | -54.76% |

### createDateClient

# Perf Report — createDateClient.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00033ms |
| p95 | 0.00060ms |
| p99 | 0.0029ms |
| mean | 0.00053ms |
| stdev | 0.0015ms |
| min | 0.00029ms |
| max | 0.02ms |
| total | 0.11ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.914)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00030ms | 0.00029ms | +0.000013ms | +4.61% |
| p50 | 0.00031ms | 0.00033ms | -0.000028ms | -8.31% |
| p95 | 0.00054ms | 0.0012ms | -0.00062ms | -53.35% |
| p99 | 0.0027ms | 0.0062ms | -0.0035ms | -56.93% |
| mean | 0.00048ms | 0.00056ms | -0.000075ms | -13.56% |
| min | 0.00027ms | 0.00029ms | -0.000025ms | -8.58% |
| max | 0.02ms | 0.01ms | +0.0052ms | +38.85% |
| total | 0.10ms | 0.11ms | -0.02ms | -13.56% |

