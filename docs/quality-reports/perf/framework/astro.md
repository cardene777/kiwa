# Perf Suite — astro

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00042ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00083ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| renderAstroPage | 0.01ms | 0.09ms | 5ms | 0.00073ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeEndpoint | 0.0087ms | 0.05ms | 5ms | 0.00077ms | PASS | regressed — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| renderAstroPage | cpu | 0.09ms | 0.12ms | 0.01ms | 0.127 | 0.138 | n/a | 20.0% | 0.01ms | 0.01ms |
| invokeEndpoint | cpu | 0.09ms | 0.10ms | 0.0087ms | 0.097 | 0.068 | n/a | 20.0% | 0.0080ms | 0.0057ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| renderAstroPage | 0.53ms | 10ms | PASS |
| invokeEndpoint | 1.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| renderAstroPage | -114176 B | 2800 B | 102400 B | yes | 220 (20 + 200) | PASS |
| invokeEndpoint | -9824 B | 2200 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### renderAstroPage

# Perf Report — renderAstroPage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.09ms |
| p99 | 0.21ms |
| mean | 0.03ms |
| stdev | 0.04ms |
| min | 0.01ms |
| max | 0.36ms |
| total | 5.61ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.881)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00089ms | -7.80% |
| p50 | 0.01ms | 0.01ms | -0.0019ms | -12.97% |
| p95 | 0.08ms | 0.07ms | +0.01ms | +17.80% |
| p99 | 0.19ms | 0.24ms | -0.05ms | -20.59% |
| mean | 0.02ms | 0.03ms | -0.00094ms | -3.65% |
| min | 0.0094ms | 0.010ms | -0.00057ms | -5.69% |
| max | 0.32ms | 0.49ms | -0.17ms | -34.27% |
| total | 4.94ms | 5.12ms | -0.19ms | -3.65% |

### invokeEndpoint

# Perf Report — invokeEndpoint.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0087ms |
| p50 | 0.0092ms |
| p95 | 0.05ms |
| p99 | 0.66ms |
| mean | 0.03ms |
| stdev | 0.12ms |
| min | 0.0083ms |
| max | 1.37ms |
| total | 5.99ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.924)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0080ms | 0.0057ms | +0.0024ms | +41.92% |
| p50 | 0.0085ms | 0.0090ms | -0.00044ms | -4.85% |
| p95 | 0.05ms | 0.12ms | -0.08ms | -62.92% |
| p99 | 0.61ms | 0.24ms | +0.37ms | +152.22% |
| mean | 0.03ms | 0.03ms | -0.0016ms | -5.50% |
| min | 0.0076ms | 0.0052ms | +0.0024ms | +46.31% |
| max | 1.27ms | 0.27ms | +1.00ms | +367.30% |
| total | 5.54ms | 5.86ms | -0.32ms | -5.50% |

