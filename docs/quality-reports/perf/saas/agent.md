# Perf Suite — agent

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| stateMachineInvoke | 0.0011ms | 0.01ms | 5ms | 0.00029ms | PASS | stable (換算後 p10 -1% (閾値未満)、 p95 +107% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| stateGraphInvoke | 0.0011ms | 0.0026ms | 5ms | 0.00030ms | PASS | stable (換算後 p10 -0% (閾値未満)、 p95 +21% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| assistantsCreateThread | 0.00033ms | 0.0018ms | 5ms | 0.00030ms | PASS | stable — gate 無効 (regressionGate=false) |
| assistantsAddMessage | 0.00042ms | 0.0077ms | 5ms | 0.00029ms | PASS | stable (差 0.00013ms が下限 0.00029ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| stateMachineInvoke | cpu | 0.09ms | 0.13ms | 0.0011ms | 0.012 | 0.012 | n/a | 20.0% | 0.00099ms | 0.0010ms |
| stateGraphInvoke | cpu | 0.09ms | 0.09ms | 0.0011ms | 0.012 | 0.012 | n/a | 20.0% | 0.00096ms | 0.00096ms |
| assistantsCreateThread | cpu | 0.09ms | 0.09ms | 0.00033ms | 0.004 | 0.004 | n/a | 20.0% | 0.00030ms | 0.00033ms |
| assistantsAddMessage | cpu | 0.09ms | 0.12ms | 0.00042ms | 0.004 | 0.006 | n/a | 20.0% | 0.00037ms | 0.00050ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| stateMachineInvoke | 0.03ms | 10ms | PASS |
| stateGraphInvoke | 0.02ms | 10ms | PASS |
| assistantsCreateThread | 0.01ms | 10ms | PASS |
| assistantsAddMessage | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| stateMachineInvoke | -15040 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| stateGraphInvoke | -15200 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| assistantsCreateThread | 39480 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| assistantsAddMessage | 98856 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### stateMachineInvoke

# Perf Report — stateMachineInvoke.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0011ms |
| p50 | 0.0013ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0031ms |
| stdev | 0.0056ms |
| min | 0.0011ms |
| max | 0.05ms |
| total | 0.63ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.877)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00099ms | 0.0010ms | -0.000014ms | -1.37% |
| p50 | 0.0011ms | 0.0011ms | -0.000011ms | -0.95% |
| p95 | 0.01ms | 0.0055ms | +0.0058ms | +106.60% |
| p99 | 0.02ms | 0.01ms | +0.0079ms | +59.75% |
| mean | 0.0028ms | 0.0021ms | +0.00064ms | +30.37% |
| min | 0.00095ms | 0.00096ms | -0.0000085ms | -0.89% |
| max | 0.05ms | 0.02ms | +0.03ms | +127.10% |
| total | 0.55ms | 0.42ms | +0.13ms | +30.37% |

### stateGraphInvoke

# Perf Report — stateGraphInvoke.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0011ms |
| p50 | 0.0011ms |
| p95 | 0.0026ms |
| p99 | 0.01ms |
| mean | 0.0016ms |
| stdev | 0.0025ms |
| min | 0.0010ms |
| max | 0.03ms |
| total | 0.32ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.884)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00096ms | 0.00096ms | -8.4e-7ms | -0.09% |
| p50 | 0.00099ms | 0.0010ms | -0.0000057ms | -0.57% |
| p95 | 0.0023ms | 0.0019ms | +0.00041ms | +21.18% |
| p99 | 0.0095ms | 0.0078ms | +0.0017ms | +22.09% |
| mean | 0.0014ms | 0.0013ms | +0.000074ms | +5.61% |
| min | 0.00092ms | 0.00092ms | +0.0000040ms | +0.44% |
| max | 0.03ms | 0.02ms | +0.0018ms | +7.89% |
| total | 0.28ms | 0.26ms | +0.01ms | +5.61% |

### assistantsCreateThread

# Perf Report — assistantsCreateThread.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00042ms |
| p95 | 0.0018ms |
| p99 | 0.010ms |
| mean | 0.00081ms |
| stdev | 0.0019ms |
| min | 0.00033ms |
| max | 0.02ms |
| total | 0.16ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.884)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00030ms | 0.00033ms | -0.000038ms | -11.34% |
| p50 | 0.00037ms | 0.00042ms | -0.000048ms | -11.61% |
| p95 | 0.0016ms | 0.0015ms | +0.000077ms | +5.00% |
| p99 | 0.0088ms | 0.0098ms | -0.00099ms | -10.09% |
| mean | 0.00072ms | 0.00083ms | -0.00012ms | -13.89% |
| min | 0.00029ms | 0.00029ms | +0.0000023ms | +0.80% |
| max | 0.02ms | 0.02ms | -0.0047ms | -20.24% |
| total | 0.14ms | 0.17ms | -0.02ms | -13.89% |

### assistantsAddMessage

# Perf Report — assistantsAddMessage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00054ms |
| p95 | 0.0077ms |
| p99 | 0.02ms |
| mean | 0.0017ms |
| stdev | 0.0037ms |
| min | 0.00038ms |
| max | 0.03ms |
| total | 0.33ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.879)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00037ms | 0.00050ms | -0.00013ms | -26.71% |
| p50 | 0.00048ms | 0.00075ms | -0.00027ms | -36.50% |
| p95 | 0.0067ms | 0.0025ms | +0.0042ms | +164.47% |
| p99 | 0.02ms | 0.02ms | +0.0018ms | +11.94% |
| mean | 0.0015ms | 0.0012ms | +0.00025ms | +20.03% |
| min | 0.00033ms | 0.00042ms | -0.000086ms | -20.79% |
| max | 0.02ms | 0.03ms | -0.0042ms | -15.35% |
| total | 0.29ms | 0.24ms | +0.05ms | +20.03% |

