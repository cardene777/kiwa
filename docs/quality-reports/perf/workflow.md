# Perf Suite — workflow

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| executeWorkflow | 0.00058ms | 0.0029ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| defineWorkflow | 0.00021ms | 0.00048ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +160%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| retryStepSucceed | 0.00029ms | 0.0020ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +114%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| executeWorkflow | cpu | 0.08ms | 0.00058ms | 0.007 | 0.007 | 0.00058ms | 0.00058ms |
| defineWorkflow | cpu | 0.08ms | 0.00021ms | 0.003 | 0.003 | 0.00021ms | 0.00021ms |
| retryStepSucceed | cpu | 0.08ms | 0.00029ms | 0.004 | 0.004 | 0.00029ms | 0.00029ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| executeWorkflow | 0.02ms | 10ms | PASS |
| defineWorkflow | 0.01ms | 10ms | PASS |
| retryStepSucceed | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| executeWorkflow | 88984 B | 0 B | 102400 B | yes | PASS |
| defineWorkflow | -16352 B | 0 B | 102400 B | yes | PASS |
| retryStepSucceed | 632 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### executeWorkflow

# Perf Report — executeWorkflow.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.00063ms |
| p95 | 0.0029ms |
| p99 | 0.0095ms |
| mean | 0.0010ms |
| stdev | 0.0016ms |
| min | 0.00054ms |
| max | 0.01ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00058ms | 0.00058ms | 0.00ms | 0.00% |
| p50 | 0.00063ms | 0.00065ms | -0.000021ms | -3.18% |
| p95 | 0.0029ms | 0.0030ms | -0.000079ms | -2.63% |
| p99 | 0.0095ms | 0.0093ms | +0.00025ms | +2.72% |
| mean | 0.0010ms | 0.0011ms | -0.000073ms | -6.65% |
| min | 0.00054ms | 0.00058ms | -0.000042ms | -7.20% |
| max | 0.01ms | 0.01ms | +0.00058ms | +5.03% |
| total | 0.21ms | 0.22ms | -0.01ms | -6.65% |

### defineWorkflow

# Perf Report — defineWorkflow.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00025ms |
| p95 | 0.00048ms |
| p99 | 0.0049ms |
| mean | 0.00043ms |
| stdev | 0.0011ms |
| min | 0.00017ms |
| max | 0.01ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p50 | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| p95 | 0.00048ms | 0.0011ms | -0.00065ms | -57.48% |
| p99 | 0.0049ms | 0.0046ms | +0.00025ms | +5.35% |
| mean | 0.00043ms | 0.00043ms | -0.0000066ms | -1.53% |
| min | 0.00017ms | 0.00021ms | -0.000041ms | -19.71% |
| max | 0.01ms | 0.0082ms | +0.0043ms | +52.06% |
| total | 0.09ms | 0.09ms | -0.0013ms | -1.53% |

### retryStepSucceed

# Perf Report — retryStepSucceed.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.0020ms |
| p99 | 0.0066ms |
| mean | 0.00067ms |
| stdev | 0.0016ms |
| min | 0.00025ms |
| max | 0.02ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00029ms | +1.0e-7ms | +0.03% |
| p50 | 0.00033ms | 0.00033ms | +5.0e-7ms | +0.15% |
| p95 | 0.0020ms | 0.0013ms | +0.00075ms | +59.44% |
| p99 | 0.0066ms | 0.0054ms | +0.0012ms | +23.12% |
| mean | 0.00067ms | 0.00055ms | +0.00012ms | +22.12% |
| min | 0.00025ms | 0.00029ms | -0.000041ms | -14.09% |
| max | 0.02ms | 0.01ms | +0.0070ms | +55.45% |
| total | 0.13ms | 0.11ms | +0.02ms | +22.12% |

