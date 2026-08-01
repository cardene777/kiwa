# Perf Suite — websocket

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| sendMessage | 0.00029ms | 0.0017ms | 5ms | 0.00031ms | PASS | stable (検知には +0.00031ms (baseline 比 +124%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| broadcastMessage | 0.00033ms | 0.0035ms | 5ms | 0.00031ms | PASS | stable (換算後 p10 -8% (閾値未満)、 p95 +59% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| captureBinaryFrame | 0.00033ms | 0.0036ms | 5ms | 0.00031ms | PASS | stable (検知には +0.00031ms (baseline 比 +105%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| sendMessage | cpu | 0.09ms | 0.09ms | 0.00029ms | 0.003 | 0.003 | n/a | 20.0% | 0.00027ms | 0.00025ms |
| broadcastMessage | cpu | 0.09ms | 0.11ms | 0.00033ms | 0.004 | 0.004 | n/a | 20.0% | 0.00031ms | 0.00033ms |
| captureBinaryFrame | cpu | 0.09ms | 0.14ms | 0.00033ms | 0.004 | 0.004 | n/a | 20.0% | 0.00031ms | 0.00029ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| sendMessage | 0.01ms | 10ms | PASS |
| broadcastMessage | 0.01ms | 10ms | PASS |
| captureBinaryFrame | 0.03ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| sendMessage | -13112 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| broadcastMessage | 10008 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| captureBinaryFrame | 16040 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### sendMessage

# Perf Report — sendMessage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00029ms |
| p95 | 0.0017ms |
| p99 | 0.0083ms |
| mean | 0.00062ms |
| stdev | 0.0013ms |
| min | 0.00025ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.925)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00027ms | 0.00025ms | +0.000019ms | +7.71% |
| p50 | 0.00027ms | 0.00029ms | -0.000022ms | -7.46% |
| p95 | 0.0016ms | 0.0026ms | -0.0011ms | -39.94% |
| p99 | 0.0077ms | 0.01ms | -0.0025ms | -24.52% |
| mean | 0.00058ms | 0.0012ms | -0.00060ms | -50.86% |
| min | 0.00023ms | 0.00025ms | -0.000019ms | -7.46% |
| max | 0.0098ms | 0.10ms | -0.09ms | -90.55% |
| total | 0.12ms | 0.24ms | -0.12ms | -50.86% |

### broadcastMessage

# Perf Report — broadcastMessage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.0035ms |
| p99 | 0.01ms |
| mean | 0.00095ms |
| stdev | 0.0023ms |
| min | 0.00033ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.918)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00031ms | 0.00033ms | -0.000026ms | -7.93% |
| p50 | 0.00034ms | 0.00038ms | -0.000031ms | -8.20% |
| p95 | 0.0032ms | 0.0020ms | +0.0012ms | +58.58% |
| p99 | 0.01ms | 0.0056ms | +0.0056ms | +99.63% |
| mean | 0.00087ms | 0.00061ms | +0.00026ms | +43.45% |
| min | 0.00031ms | 0.00029ms | +0.000014ms | +4.68% |
| max | 0.02ms | 0.010ms | +0.0084ms | +83.98% |
| total | 0.17ms | 0.12ms | +0.05ms | +43.45% |

### captureBinaryFrame

# Perf Report — captureBinaryFrame.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00033ms |
| p95 | 0.0036ms |
| p99 | 0.01ms |
| mean | 0.0011ms |
| stdev | 0.0025ms |
| min | 0.00029ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.917)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00031ms | 0.00029ms | +0.000014ms | +4.95% |
| p50 | 0.00031ms | 0.00033ms | -0.000027ms | -8.01% |
| p95 | 0.0033ms | 0.0035ms | -0.00025ms | -7.16% |
| p99 | 0.0098ms | 0.02ms | -0.01ms | -53.28% |
| mean | 0.00098ms | 0.0011ms | -0.00011ms | -10.22% |
| min | 0.00027ms | 0.00025ms | +0.000017ms | +6.76% |
| max | 0.02ms | 0.04ms | -0.02ms | -49.09% |
| total | 0.20ms | 0.22ms | -0.02ms | -10.22% |

