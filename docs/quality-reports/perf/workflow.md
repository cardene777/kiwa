# Perf Suite — workflow

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| executeWorkflow | 0.00067ms | 0.0032ms | 5ms | 0.00031ms | PASS | stable — gate 無効 (regressionGate=false) |
| defineWorkflow | 0.00025ms | 0.0071ms | 5ms | 0.00030ms | PASS | stable (検知には +0.00030ms (baseline 比 +144%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| retryStepSucceed | 0.00038ms | 0.0068ms | 5ms | 0.00030ms | PASS | stable (検知には +0.00030ms (baseline 比 +103%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| executeWorkflow | cpu | 0.09ms | 0.09ms | 0.00067ms | 0.008 | 0.007 | 0.00061ms | 0.00058ms |
| defineWorkflow | cpu | 0.09ms | 0.29ms | 0.00025ms | 0.003 | 0.003 | 0.00022ms | 0.00021ms |
| retryStepSucceed | cpu | 0.09ms | 0.11ms | 0.00038ms | 0.004 | 0.004 | 0.00034ms | 0.00029ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| executeWorkflow | 0.02ms | 10ms | PASS |
| defineWorkflow | 0.01ms | 10ms | PASS |
| retryStepSucceed | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| executeWorkflow | 89752 B | -47477 B | 102400 B | yes | PASS |
| defineWorkflow | 3280 B | 0 B | 102400 B | yes | PASS |
| retryStepSucceed | 10536 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### executeWorkflow

# Perf Report — executeWorkflow.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00067ms |
| p50 | 0.00075ms |
| p95 | 0.0032ms |
| p99 | 0.01ms |
| mean | 0.0015ms |
| stdev | 0.0040ms |
| min | 0.00063ms |
| max | 0.05ms |
| total | 0.30ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.920)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00061ms | 0.00058ms | +0.000031ms | +5.24% |
| p50 | 0.00069ms | 0.00063ms | +0.000065ms | +10.38% |
| p95 | 0.0029ms | 0.0051ms | -0.0022ms | -42.68% |
| p99 | 0.01ms | 0.01ms | +0.00091ms | +8.46% |
| mean | 0.0014ms | 0.0013ms | +0.000070ms | +5.39% |
| min | 0.00057ms | 0.00054ms | +0.000034ms | +6.27% |
| max | 0.05ms | 0.03ms | +0.01ms | +43.49% |
| total | 0.27ms | 0.26ms | +0.01ms | +5.39% |

### defineWorkflow

# Perf Report — defineWorkflow.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00025ms |
| p95 | 0.0071ms |
| p99 | 0.01ms |
| mean | 0.0017ms |
| stdev | 0.0067ms |
| min | 0.00021ms |
| max | 0.07ms |
| total | 0.33ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.898)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00022ms | 0.00021ms | +0.000016ms | +7.90% |
| p50 | 0.00022ms | 0.00025ms | -0.000026ms | -10.22% |
| p95 | 0.0064ms | 0.00060ms | +0.0058ms | +957.69% |
| p99 | 0.01ms | 0.0046ms | +0.0083ms | +180.50% |
| mean | 0.0015ms | 0.00039ms | +0.0011ms | +284.14% |
| min | 0.00019ms | 0.00021ms | -0.000021ms | -10.22% |
| max | 0.06ms | 0.0077ms | +0.06ms | +728.74% |
| total | 0.30ms | 0.08ms | +0.22ms | +284.14% |

### retryStepSucceed

# Perf Report — retryStepSucceed.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00046ms |
| p95 | 0.0068ms |
| p99 | 0.02ms |
| mean | 0.0014ms |
| stdev | 0.0032ms |
| min | 0.00033ms |
| max | 0.03ms |
| total | 0.27ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.897)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00034ms | 0.00029ms | +0.000044ms | +15.13% |
| p50 | 0.00041ms | 0.00033ms | +0.000077ms | +22.93% |
| p95 | 0.0061ms | 0.0018ms | +0.0043ms | +240.52% |
| p99 | 0.02ms | 0.0061ms | +0.01ms | +169.33% |
| mean | 0.0012ms | 0.00074ms | +0.00048ms | +64.47% |
| min | 0.00030ms | 0.00029ms | +0.0000075ms | +2.59% |
| max | 0.02ms | 0.02ms | +0.0030ms | +15.10% |
| total | 0.24ms | 0.15ms | +0.10ms | +64.47% |

