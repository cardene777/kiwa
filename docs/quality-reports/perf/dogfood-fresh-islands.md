# Perf Suite — dogfood-fresh-islands

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveRoute | 0.04ms | 0.11ms | 80ms | 0.00030ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveIsland | 0.0065ms | 0.02ms | 80ms | 0.00030ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveHead | 0.0030ms | 0.0064ms | 50ms | 0.00030ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveEdgeEnv | 0.01ms | 0.02ms | 100ms | 0.00030ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| driveRoute | cpu | 0.09ms | 0.10ms | 0.04ms | 0.417 | 0.427 | n/a | 20.0% | 0.03ms | 0.03ms |
| driveIsland | cpu | 0.09ms | 0.09ms | 0.0065ms | 0.072 | 0.072 | n/a | 20.0% | 0.0058ms | 0.0059ms |
| driveHead | cpu | 0.09ms | 0.09ms | 0.0030ms | 0.033 | 0.033 | n/a | 20.0% | 0.0027ms | 0.0027ms |
| driveEdgeEnv | cpu | 0.09ms | 0.09ms | 0.01ms | 0.117 | 0.123 | n/a | 20.0% | 0.0095ms | 0.01ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveRoute | 1.07ms | 160ms | PASS |
| driveIsland | 0.09ms | 160ms | PASS |
| driveHead | 0.04ms | 100ms | PASS |
| driveEdgeEnv | 0.11ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| driveRoute | -206144 B | -41939 B | 102400 B | yes | 220 (20 + 200) | PASS |
| driveIsland | 824 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| driveHead | 1304 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| driveEdgeEnv | 568 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### driveRoute

# Perf Report — driveRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.04ms |
| p50 | 0.05ms |
| p95 | 0.11ms |
| p99 | 0.18ms |
| mean | 0.05ms |
| stdev | 0.04ms |
| min | 0.04ms |
| max | 0.48ms |
| total | 11.00ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.899)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.00083ms | -2.40% |
| p50 | 0.04ms | 0.04ms | -0.0029ms | -6.75% |
| p95 | 0.10ms | 0.12ms | -0.02ms | -17.14% |
| p99 | 0.17ms | 0.21ms | -0.04ms | -19.91% |
| mean | 0.05ms | 0.06ms | -0.0058ms | -10.54% |
| min | 0.03ms | 0.03ms | +0.00062ms | +2.02% |
| max | 0.43ms | 0.36ms | +0.07ms | +19.71% |
| total | 9.88ms | 11.05ms | -1.16ms | -10.54% |

### driveIsland

# Perf Report — driveIsland.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0065ms |
| p50 | 0.0071ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.0097ms |
| stdev | 0.02ms |
| min | 0.0063ms |
| max | 0.20ms |
| total | 1.94ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.903)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0058ms | 0.0059ms | -0.000044ms | -0.75% |
| p50 | 0.0064ms | 0.0066ms | -0.00021ms | -3.11% |
| p95 | 0.02ms | 0.02ms | +0.00031ms | +1.96% |
| p99 | 0.04ms | 0.04ms | -0.0049ms | -11.96% |
| mean | 0.0087ms | 0.0083ms | +0.00050ms | +6.01% |
| min | 0.0056ms | 0.0057ms | -0.000021ms | -0.36% |
| max | 0.18ms | 0.07ms | +0.11ms | +169.30% |
| total | 1.75ms | 1.65ms | +0.10ms | +6.01% |

### driveHead

# Perf Report — driveHead.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0030ms |
| p50 | 0.0032ms |
| p95 | 0.0064ms |
| p99 | 0.03ms |
| mean | 0.0045ms |
| stdev | 0.0095ms |
| min | 0.0030ms |
| max | 0.13ms |
| total | 0.90ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.903)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0027ms | +0.0000010ms | +0.04% |
| p50 | 0.0029ms | 0.0028ms | +0.000025ms | +0.90% |
| p95 | 0.0058ms | 0.0053ms | +0.00047ms | +8.75% |
| p99 | 0.03ms | 0.02ms | +0.0062ms | +30.15% |
| mean | 0.0041ms | 0.0034ms | +0.00064ms | +18.64% |
| min | 0.0027ms | 0.0026ms | +0.000088ms | +3.41% |
| max | 0.12ms | 0.02ms | +0.09ms | +380.95% |
| total | 0.81ms | 0.68ms | +0.13ms | +18.64% |

### driveEdgeEnv

# Perf Report — driveEdgeEnv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.27ms |
| total | 2.72ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.903)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0095ms | 0.01ms | -0.00048ms | -4.81% |
| p50 | 0.0099ms | 0.01ms | -0.00073ms | -6.87% |
| p95 | 0.02ms | 0.03ms | -0.01ms | -38.22% |
| p99 | 0.03ms | 0.06ms | -0.03ms | -45.10% |
| mean | 0.01ms | 0.01ms | -0.0018ms | -12.88% |
| min | 0.0093ms | 0.0095ms | -0.00029ms | -3.00% |
| max | 0.24ms | 0.13ms | +0.11ms | +85.54% |
| total | 2.46ms | 2.82ms | -0.36ms | -12.88% |

