# Perf Suite — graphql

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| parseGraphQLOperation | 0.00075ms | 0.0045ms | 5ms | 0.00032ms | PASS | stable — gate 無効 (regressionGate=false) |
| executeQuery | 0.0010ms | 0.02ms | 5ms | 0.00033ms | PASS | stable (換算後 p10 +7% (閾値未満)、 p95 +201% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| clientQuery | 0.00088ms | 0.0032ms | 5ms | 0.00032ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| parseGraphQLOperation | cpu | 0.08ms | 0.09ms | 0.00075ms | 0.009 | 0.009 | 0.00073ms | 0.00075ms |
| executeQuery | cpu | 0.08ms | 0.14ms | 0.0010ms | 0.012 | 0.011 | 0.00099ms | 0.00092ms |
| clientQuery | cpu | 0.08ms | 0.08ms | 0.00088ms | 0.011 | 0.011 | 0.00085ms | 0.00092ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| parseGraphQLOperation | 0.02ms | 10ms | PASS |
| executeQuery | 0.03ms | 10ms | PASS |
| clientQuery | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| parseGraphQLOperation | -2616 B | 0 B | 102400 B | yes | PASS |
| executeQuery | 6568 B | 0 B | 102400 B | yes | PASS |
| clientQuery | 28432 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### parseGraphQLOperation

# Perf Report — parseGraphQLOperation.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00075ms |
| p50 | 0.00083ms |
| p95 | 0.0045ms |
| p99 | 0.01ms |
| mean | 0.0016ms |
| stdev | 0.0031ms |
| min | 0.00071ms |
| max | 0.03ms |
| total | 0.33ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.975)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00073ms | 0.00075ms | -0.000019ms | -2.52% |
| p50 | 0.00081ms | 0.00083ms | -0.000021ms | -2.58% |
| p95 | 0.0044ms | 0.0098ms | -0.0054ms | -54.94% |
| p99 | 0.01ms | 0.02ms | -0.0058ms | -28.61% |
| mean | 0.0016ms | 0.0018ms | -0.00025ms | -13.71% |
| min | 0.00069ms | 0.00067ms | +0.000024ms | +3.63% |
| max | 0.03ms | 0.03ms | -0.0031ms | -10.23% |
| total | 0.32ms | 0.37ms | -0.05ms | -13.71% |

### executeQuery

# Perf Report — executeQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0013ms |
| p95 | 0.02ms |
| p99 | 0.05ms |
| mean | 0.0051ms |
| stdev | 0.0098ms |
| min | 0.00092ms |
| max | 0.07ms |
| total | 1.03ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.985)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00099ms | 0.00092ms | +0.000068ms | +7.47% |
| p50 | 0.0012ms | 0.0011ms | +0.00015ms | +13.73% |
| p95 | 0.02ms | 0.0079ms | +0.02ms | +200.68% |
| p99 | 0.05ms | 0.03ms | +0.02ms | +78.73% |
| mean | 0.0051ms | 0.0023ms | +0.0028ms | +120.18% |
| min | 0.00090ms | 0.00083ms | +0.000070ms | +8.36% |
| max | 0.07ms | 0.04ms | +0.03ms | +65.37% |
| total | 1.01ms | 0.46ms | +0.55ms | +120.18% |

### clientQuery

# Perf Report — clientQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00088ms |
| p50 | 0.00096ms |
| p95 | 0.0032ms |
| p99 | 0.03ms |
| mean | 0.0017ms |
| stdev | 0.0038ms |
| min | 0.00083ms |
| max | 0.03ms |
| total | 0.34ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.974)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00085ms | 0.00092ms | -0.000064ms | -6.97% |
| p50 | 0.00093ms | 0.0010ms | -0.00011ms | -10.36% |
| p95 | 0.0031ms | 0.0031ms | -0.0000090ms | -0.29% |
| p99 | 0.03ms | 0.0059ms | +0.02ms | +397.45% |
| mean | 0.0016ms | 0.0015ms | +0.00013ms | +8.47% |
| min | 0.00081ms | 0.00088ms | -0.000063ms | -7.17% |
| max | 0.03ms | 0.03ms | +0.000012ms | +0.04% |
| total | 0.33ms | 0.30ms | +0.03ms | +8.47% |

