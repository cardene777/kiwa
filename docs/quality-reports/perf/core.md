# Perf Suite — core

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| parseSpec | 0.0030ms | 0.03ms | 5ms | 0.00030ms | PASS | improved — gate 無効 (regressionGate=false) |
| createPool | 0.0012ms | 0.0027ms | 5ms | 0.00030ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| parseSpec | cpu | 0.09ms | 0.14ms | 0.0030ms | 0.033 | 0.046 | n/a | 20.0% | 0.0027ms | 0.0037ms |
| createPool | cpu | 0.09ms | 0.09ms | 0.0012ms | 0.013 | 0.014 | n/a | 20.0% | 0.0011ms | 0.0011ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| parseSpec | 0.11ms | 10ms | PASS |
| createPool | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| parseSpec | -624 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| createPool | 15128 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### parseSpec

# Perf Report — parseSpec.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0030ms |
| p50 | 0.0052ms |
| p95 | 0.03ms |
| p99 | 0.05ms |
| mean | 0.0087ms |
| stdev | 0.0094ms |
| min | 0.0029ms |
| max | 0.05ms |
| total | 1.75ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.896)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0037ms | -0.0011ms | -28.32% |
| p50 | 0.0046ms | 0.0055ms | -0.00081ms | -14.84% |
| p95 | 0.03ms | 0.02ms | +0.01ms | +68.06% |
| p99 | 0.04ms | 0.02ms | +0.02ms | +99.23% |
| mean | 0.0078ms | 0.01ms | -0.0045ms | -36.48% |
| min | 0.0026ms | 0.0026ms | +0.000030ms | +1.16% |
| max | 0.05ms | 1.09ms | -1.05ms | -95.58% |
| total | 1.56ms | 2.46ms | -0.90ms | -36.48% |

### createPool

# Perf Report — createPool.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0012ms |
| p50 | 0.0014ms |
| p95 | 0.0027ms |
| p99 | 0.0090ms |
| mean | 0.0017ms |
| stdev | 0.0022ms |
| min | 0.0011ms |
| max | 0.03ms |
| total | 0.35ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.895)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0011ms | 0.0011ms | -0.000043ms | -3.86% |
| p50 | 0.0012ms | 0.0012ms | +0.000023ms | +1.91% |
| p95 | 0.0024ms | 0.0030ms | -0.00060ms | -20.22% |
| p99 | 0.0080ms | 0.02ms | -0.0093ms | -53.63% |
| mean | 0.0016ms | 0.0018ms | -0.00028ms | -15.26% |
| min | 0.0010ms | 0.0011ms | -0.000076ms | -6.99% |
| max | 0.02ms | 0.03ms | -0.0015ms | -5.72% |
| total | 0.31ms | 0.37ms | -0.06ms | -15.26% |

