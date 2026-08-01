# Perf Suite — react-native

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| createRNTestEnv | 0.00046ms | 0.0061ms | 5ms | 0.00031ms | PASS | stable — gate 無効 (regressionGate=false) |
| asyncStorageSetGet | 0.00046ms | 0.0022ms | 5ms | 0.00030ms | PASS | stable — gate 無効 (regressionGate=false) |
| navigate | 0.00038ms | 0.0013ms | 5ms | 0.00031ms | PASS | stable — gate 無効 (regressionGate=false) |
| dispatchLinkingUrl | 0.00046ms | 0.00092ms | 5ms | 0.00029ms | PASS | stable — gate 無効 (regressionGate=false) |
| setPlatform | 0.00038ms | 0.0012ms | 5ms | 0.00031ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| createRNTestEnv | cpu | 0.09ms | 0.12ms | 0.00046ms | 0.005 | 0.005 | n/a | 20.0% | 0.00042ms | 0.00042ms |
| asyncStorageSetGet | cpu | 0.09ms | 0.12ms | 0.00046ms | 0.005 | 0.005 | n/a | 20.0% | 0.00040ms | 0.00038ms |
| navigate | cpu | 0.09ms | 0.09ms | 0.00038ms | 0.004 | 0.004 | n/a | 20.0% | 0.00034ms | 0.00033ms |
| dispatchLinkingUrl | cpu | 0.09ms | 0.09ms | 0.00046ms | 0.005 | 0.006 | n/a | 20.0% | 0.00040ms | 0.00046ms |
| setPlatform | cpu | 0.09ms | 0.09ms | 0.00038ms | 0.004 | 0.004 | n/a | 20.0% | 0.00035ms | 0.00033ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createRNTestEnv | 0.02ms | 10ms | PASS |
| asyncStorageSetGet | 0.01ms | 10ms | PASS |
| navigate | 0.01ms | 10ms | PASS |
| dispatchLinkingUrl | 0.01ms | 10ms | PASS |
| setPlatform | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| createRNTestEnv | 2520 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| asyncStorageSetGet | -280 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| navigate | -11464 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| dispatchLinkingUrl | 2288 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| setPlatform | 976 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### createRNTestEnv

# Perf Report — createRNTestEnv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.0061ms |
| p99 | 0.02ms |
| mean | 0.0013ms |
| stdev | 0.0026ms |
| min | 0.00042ms |
| max | 0.02ms |
| total | 0.26ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.923)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | +0.0000055ms | +1.32% |
| p50 | 0.00046ms | 0.00054ms | -0.000081ms | -14.90% |
| p95 | 0.0056ms | 0.0065ms | -0.00091ms | -13.92% |
| p99 | 0.01ms | 0.01ms | +0.00012ms | +0.82% |
| mean | 0.0012ms | 0.0017ms | -0.00047ms | -27.81% |
| min | 0.00038ms | 0.00038ms | +0.0000088ms | +2.34% |
| max | 0.02ms | 0.02ms | -0.0063ms | -26.69% |
| total | 0.24ms | 0.34ms | -0.09ms | -27.81% |

### asyncStorageSetGet

# Perf Report — asyncStorageSetGet.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.0022ms |
| p99 | 0.0087ms |
| mean | 0.00086ms |
| stdev | 0.0016ms |
| min | 0.00042ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.883)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00040ms | 0.00038ms | +0.000030ms | +7.89% |
| p50 | 0.00044ms | 0.00042ms | +0.000025ms | +5.92% |
| p95 | 0.0019ms | 0.0043ms | -0.0023ms | -55.12% |
| p99 | 0.0077ms | 0.0079ms | -0.00018ms | -2.34% |
| mean | 0.00076ms | 0.00086ms | -0.000095ms | -11.04% |
| min | 0.00037ms | 0.00038ms | -0.0000075ms | -2.00% |
| max | 0.01ms | 0.01ms | +0.0019ms | +16.53% |
| total | 0.15ms | 0.17ms | -0.02ms | -11.04% |

### navigate

# Perf Report — navigate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00038ms |
| p95 | 0.0013ms |
| p99 | 0.0026ms |
| mean | 0.00059ms |
| stdev | 0.0015ms |
| min | 0.00033ms |
| max | 0.02ms |
| total | 0.12ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.914)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00034ms | 0.00033ms | +0.0000088ms | +2.64% |
| p50 | 0.00034ms | 0.00038ms | -0.000032ms | -8.58% |
| p95 | 0.0011ms | 0.0022ms | -0.0010ms | -46.83% |
| p99 | 0.0024ms | 0.01ms | -0.0098ms | -80.61% |
| mean | 0.00054ms | 0.00082ms | -0.00028ms | -34.01% |
| min | 0.00030ms | 0.00033ms | -0.000029ms | -8.58% |
| max | 0.02ms | 0.02ms | -0.0035ms | -15.22% |
| total | 0.11ms | 0.16ms | -0.06ms | -34.01% |

### dispatchLinkingUrl

# Perf Report — dispatchLinkingUrl.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.00092ms |
| p99 | 0.0038ms |
| mean | 0.00063ms |
| stdev | 0.00089ms |
| min | 0.00042ms |
| max | 0.01ms |
| total | 0.13ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.878)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00040ms | 0.00046ms | -0.000056ms | -12.24% |
| p50 | 0.00044ms | 0.00050ms | -0.000061ms | -12.24% |
| p95 | 0.00081ms | 0.0022ms | -0.0014ms | -62.86% |
| p99 | 0.0033ms | 0.01ms | -0.01ms | -76.29% |
| mean | 0.00055ms | 0.00098ms | -0.00043ms | -43.95% |
| min | 0.00037ms | 0.00046ms | -0.000093ms | -20.29% |
| max | 0.01ms | 0.02ms | -0.01ms | -57.05% |
| total | 0.11ms | 0.20ms | -0.09ms | -43.95% |

### setPlatform

# Perf Report — setPlatform.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00050ms |
| p95 | 0.0012ms |
| p99 | 0.0061ms |
| mean | 0.00075ms |
| stdev | 0.0019ms |
| min | 0.00033ms |
| max | 0.02ms |
| total | 0.15ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.922)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00035ms | 0.00033ms | +0.000012ms | +3.58% |
| p50 | 0.00046ms | 0.00042ms | +0.000044ms | +10.59% |
| p95 | 0.0011ms | 0.0027ms | -0.0016ms | -58.04% |
| p99 | 0.0056ms | 0.01ms | -0.0051ms | -47.91% |
| mean | 0.00069ms | 0.00085ms | -0.00017ms | -19.40% |
| min | 0.00031ms | 0.00029ms | +0.000016ms | +5.54% |
| max | 0.02ms | 0.02ms | +0.0037ms | +19.35% |
| total | 0.14ms | 0.17ms | -0.03ms | -19.40% |

