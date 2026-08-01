# Perf Suite — ui

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| setupComponentEnvSnapshot | 0.20ms | 0.42ms | 30ms | 0.00038ms | PASS | stable — gate 無効 (regressionGate=false) |
| setupComponentEnvRender | 0.15ms | 0.29ms | 30ms | 0.00037ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| setupComponentEnvSnapshot | cpu | 0.09ms | 0.10ms | 0.20ms | 2.293 | 2.322 | n/a | 20.0% | 0.19ms | 0.19ms |
| setupComponentEnvRender | cpu | 0.09ms | 0.11ms | 0.15ms | 1.615 | 1.649 | n/a | 20.0% | 0.13ms | 0.13ms |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| setupComponentEnvSnapshot | 3.02ms | 60ms | PASS |
| setupComponentEnvRender | 0.67ms | 60ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| setupComponentEnvSnapshot | -87464 B | -934 B | 102400 B | yes | 55 (5 + 50) | PASS |
| setupComponentEnvRender | 36928 B | 0 B | 102400 B | yes | 55 (5 + 50) | PASS |

## Detailed serial reports

### setupComponentEnvSnapshot

# Perf Report — setupComponentEnvSnapshot.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.20ms |
| p50 | 0.23ms |
| p95 | 0.42ms |
| p99 | 0.63ms |
| mean | 0.26ms |
| stdev | 0.10ms |
| min | 0.18ms |
| max | 0.67ms |
| total | 13.15ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.924)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.19ms | 0.19ms | -0.0024ms | -1.28% |
| p50 | 0.21ms | 0.22ms | -0.0071ms | -3.24% |
| p95 | 0.39ms | 0.47ms | -0.08ms | -17.26% |
| p99 | 0.59ms | 0.55ms | +0.04ms | +7.16% |
| mean | 0.24ms | 0.25ms | -0.0087ms | -3.44% |
| min | 0.17ms | 0.17ms | -0.0057ms | -3.29% |
| max | 0.62ms | 0.55ms | +0.07ms | +13.05% |
| total | 12.14ms | 12.58ms | -0.43ms | -3.44% |

### setupComponentEnvRender

# Perf Report — setupComponentEnvRender.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.15ms |
| p50 | 0.18ms |
| p95 | 0.29ms |
| p99 | 1.18ms |
| mean | 0.22ms |
| stdev | 0.21ms |
| min | 0.14ms |
| max | 1.56ms |
| total | 11.09ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.898)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.13ms | 0.13ms | -0.0027ms | -2.06% |
| p50 | 0.16ms | 0.16ms | +0.00066ms | +0.42% |
| p95 | 0.26ms | 0.30ms | -0.04ms | -13.17% |
| p99 | 1.06ms | 0.37ms | +0.69ms | +189.38% |
| mean | 0.20ms | 0.18ms | +0.02ms | +10.69% |
| min | 0.12ms | 0.13ms | -0.0049ms | -3.83% |
| max | 1.40ms | 0.39ms | +1.00ms | +254.71% |
| total | 9.96ms | 9.00ms | +0.96ms | +10.69% |

