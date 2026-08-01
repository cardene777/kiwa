# Perf Suite — workflow

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| executeWorkflow | 0.00058ms | 0.0029ms | 5ms | 0.00031ms | PASS | stable — gate 無効 (regressionGate=false) |
| defineWorkflow | 0.00021ms | 0.0026ms | 5ms | 0.00031ms | PASS | stable (検知には +0.00031ms (baseline 比 +147%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| retryStepSucceed | 0.00033ms | 0.0052ms | 5ms | 0.00030ms | PASS | stable (検知には +0.00030ms (baseline 比 +103%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| executeWorkflow | cpu | 0.09ms | 0.09ms | 0.00058ms | 0.007 | 0.007 | n/a | 20.0% | 0.00055ms | 0.00058ms |
| defineWorkflow | cpu | 0.09ms | 0.10ms | 0.00021ms | 0.002 | 0.003 | n/a | 20.0% | 0.00019ms | 0.00021ms |
| retryStepSucceed | cpu | 0.09ms | 0.12ms | 0.00033ms | 0.004 | 0.004 | n/a | 20.0% | 0.00030ms | 0.00029ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| executeWorkflow | 0.02ms | 10ms | PASS |
| defineWorkflow | 0.01ms | 10ms | PASS |
| retryStepSucceed | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| executeWorkflow | 79440 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| defineWorkflow | -488 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| retryStepSucceed | 1760 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### executeWorkflow

# Perf Report — executeWorkflow.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.00067ms |
| p95 | 0.0029ms |
| p99 | 0.0079ms |
| mean | 0.0011ms |
| stdev | 0.0016ms |
| min | 0.00058ms |
| max | 0.01ms |
| total | 0.21ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.945)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00055ms | 0.00058ms | -0.000032ms | -5.49% |
| p50 | 0.00063ms | 0.00063ms | +0.0000044ms | +0.71% |
| p95 | 0.0028ms | 0.0051ms | -0.0024ms | -46.28% |
| p99 | 0.0074ms | 0.01ms | -0.0034ms | -31.18% |
| mean | 0.0010ms | 0.0013ms | -0.00028ms | -21.97% |
| min | 0.00055ms | 0.00054ms | +0.000010ms | +1.85% |
| max | 0.01ms | 0.03ms | -0.02ms | -59.64% |
| total | 0.20ms | 0.26ms | -0.06ms | -21.97% |

### defineWorkflow

# Perf Report — defineWorkflow.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00025ms |
| p95 | 0.0026ms |
| p99 | 0.0064ms |
| mean | 0.00054ms |
| stdev | 0.0012ms |
| min | 0.00021ms |
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.923)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00019ms | 0.00021ms | -0.000015ms | -7.24% |
| p50 | 0.00023ms | 0.00025ms | -0.000019ms | -7.68% |
| p95 | 0.0024ms | 0.00060ms | +0.0018ms | +303.55% |
| p99 | 0.0059ms | 0.0046ms | +0.0013ms | +28.35% |
| mean | 0.00050ms | 0.00039ms | +0.00011ms | +29.26% |
| min | 0.00019ms | 0.00021ms | -0.000016ms | -7.68% |
| max | 0.0097ms | 0.0077ms | +0.0020ms | +25.58% |
| total | 0.10ms | 0.08ms | +0.02ms | +29.26% |

### retryStepSucceed

# Perf Report — retryStepSucceed.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.0052ms |
| p99 | 0.0074ms |
| mean | 0.0010ms |
| stdev | 0.0021ms |
| min | 0.00029ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.902)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00030ms | 0.00029ms | +0.0000084ms | +2.86% |
| p50 | 0.00034ms | 0.00033ms | +0.0000042ms | +1.27% |
| p95 | 0.0047ms | 0.0018ms | +0.0029ms | +160.13% |
| p99 | 0.0067ms | 0.0061ms | +0.00060ms | +9.84% |
| mean | 0.00093ms | 0.00074ms | +0.00019ms | +25.58% |
| min | 0.00026ms | 0.00029ms | -0.000028ms | -9.49% |
| max | 0.02ms | 0.02ms | +0.00010ms | +0.52% |
| total | 0.19ms | 0.15ms | +0.04ms | +25.58% |

