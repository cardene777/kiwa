# Perf Suite — hono

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeRoute | 0.0020ms | 0.02ms | 5ms | 0.00030ms | PASS | stable (換算後 p10 +5% (閾値未満)、 p95 +184% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| rpcClient$get | 0.0029ms | 0.01ms | 5ms | 0.00030ms | PASS | stable (換算後 p10 +0% (閾値未満)、 p95 +120% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| invokeRoute | cpu | 0.09ms | 0.15ms | 0.0020ms | 0.023 | 0.022 | n/a | 20.0% | 0.0018ms | 0.0018ms |
| rpcClient$get | cpu | 0.09ms | 0.12ms | 0.0029ms | 0.032 | 0.032 | n/a | 20.0% | 0.0026ms | 0.0026ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeRoute | 0.04ms | 10ms | PASS |
| rpcClient$get | 0.05ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| invokeRoute | 11704 B | -32373 B | 102400 B | yes | 220 (20 + 200) | PASS |
| rpcClient$get | 23208 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### invokeRoute

# Perf Report — invokeRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0020ms |
| p50 | 0.0022ms |
| p95 | 0.02ms |
| p99 | 0.05ms |
| mean | 0.0085ms |
| stdev | 0.04ms |
| min | 0.0020ms |
| max | 0.48ms |
| total | 1.70ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.896)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0018ms | 0.0018ms | +0.000081ms | +4.61% |
| p50 | 0.0020ms | 0.0020ms | +0.000021ms | +1.10% |
| p95 | 0.02ms | 0.0068ms | +0.01ms | +184.35% |
| p99 | 0.04ms | 0.02ms | +0.03ms | +147.27% |
| mean | 0.0076ms | 0.0031ms | +0.0045ms | +145.42% |
| min | 0.0018ms | 0.0017ms | +0.000047ms | +2.77% |
| max | 0.43ms | 0.03ms | +0.40ms | +1263.12% |
| total | 1.52ms | 0.62ms | +0.90ms | +145.42% |

### rpcClient$get

# Perf Report — rpcClient$get.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0029ms |
| p50 | 0.0030ms |
| p95 | 0.01ms |
| p99 | 0.05ms |
| mean | 0.0069ms |
| stdev | 0.03ms |
| min | 0.0028ms |
| max | 0.44ms |
| total | 1.38ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.902)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0026ms | 0.0026ms | +0.000010ms | +0.41% |
| p50 | 0.0027ms | 0.0028ms | -0.00013ms | -4.44% |
| p95 | 0.0092ms | 0.0042ms | +0.0050ms | +120.02% |
| p99 | 0.05ms | 0.0095ms | +0.04ms | +405.50% |
| mean | 0.0062ms | 0.0032ms | +0.0030ms | +92.82% |
| min | 0.0025ms | 0.0025ms | +0.000019ms | +0.75% |
| max | 0.40ms | 0.04ms | +0.36ms | +869.83% |
| total | 1.24ms | 0.64ms | +0.60ms | +92.82% |

