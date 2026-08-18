# Perf Suite — cli-test

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| writeFile | 0.14ms | 0.53ms | 20ms | 0.00029ms | PASS | stable (換算後 p10 -11% (閾値未満)、 p95 +71% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| readFile | 0.05ms | 0.21ms | 10ms | 0.00036ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| writeFile | fs-write | 0.10ms | 0.37ms | 0.14ms | 1.328 | 1.489 | 7.3% | 20.0% | 0.10ms | 0.11ms |
| readFile | fs-read | 0.05ms | 0.20ms | 0.05ms | 0.985 | 1.006 | 1.5% | 20.0% | 0.04ms | 0.04ms |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| writeFile | 0.99ms | 40ms | PASS |
| readFile | 0.30ms | 20ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| writeFile | 5384 B | -24610 B | 102400 B | yes | 110 (10 + 100) | PASS |
| readFile | 7968 B | -77913 B | 102400 B | yes | 110 (10 + 100) | PASS |

## Detailed serial reports

### writeFile

# Perf Report — writeFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.14ms |
| p50 | 0.29ms |
| p95 | 0.53ms |
| p99 | 0.57ms |
| mean | 0.30ms |
| stdev | 0.12ms |
| min | 0.10ms |
| max | 0.63ms |
| total | 29.75ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.699)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.10ms | 0.11ms | -0.01ms | -10.82% |
| p50 | 0.20ms | 0.13ms | +0.07ms | +54.34% |
| p95 | 0.37ms | 0.22ms | +0.15ms | +71.38% |
| p99 | 0.40ms | 0.25ms | +0.15ms | +59.54% |
| mean | 0.21ms | 0.14ms | +0.06ms | +45.34% |
| min | 0.07ms | 0.10ms | -0.03ms | -28.80% |
| max | 0.44ms | 0.32ms | +0.12ms | +37.39% |
| total | 20.81ms | 14.32ms | +6.49ms | +45.34% |

### readFile

# Perf Report — readFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.07ms |
| p95 | 0.21ms |
| p99 | 0.27ms |
| mean | 0.09ms |
| stdev | 0.07ms |
| min | 0.04ms |
| max | 0.60ms |
| total | 9.35ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.867)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | -0.00085ms | -2.07% |
| p50 | 0.06ms | 0.06ms | +0.0030ms | +5.04% |
| p95 | 0.18ms | 0.28ms | -0.10ms | -35.70% |
| p99 | 0.24ms | 0.78ms | -0.54ms | -69.69% |
| mean | 0.08ms | 0.12ms | -0.04ms | -31.01% |
| min | 0.04ms | 0.04ms | -0.00097ms | -2.63% |
| max | 0.52ms | 1.70ms | -1.18ms | -69.56% |
| total | 8.11ms | 11.76ms | -3.65ms | -31.01% |

