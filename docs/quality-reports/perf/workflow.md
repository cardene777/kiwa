# Perf Suite — workflow

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| executeWorkflow | 0.00058ms | 0.0031ms | 5ms | 0.00033ms | PASS | stable (p10 0% (閾値未満)、 p95 +25% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| defineWorkflow | 0.00017ms | 0.00084ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +160%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| retryStepSucceed | 0.00038ms | 0.0010ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| executeWorkflow | 0.02ms | 10ms | PASS |
| defineWorkflow | 0.01ms | 10ms | PASS |
| retryStepSucceed | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| executeWorkflow | 75360 B | 0 B | 102400 B | yes | PASS |
| defineWorkflow | -16288 B | 0 B | 102400 B | yes | PASS |
| retryStepSucceed | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### executeWorkflow

# Perf Report — executeWorkflow.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.00063ms |
| p95 | 0.0031ms |
| p99 | 0.01ms |
| mean | 0.0011ms |
| stdev | 0.0027ms |
| min | 0.00054ms |
| max | 0.03ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00058ms | 0.00058ms | 0.00ms | 0.00% |
| p50 | 0.00063ms | 0.00063ms | 0.00ms | 0.00% |
| p95 | 0.0031ms | 0.0025ms | +0.00063ms | +25.29% |
| p99 | 0.01ms | 0.0086ms | +0.0029ms | +33.36% |
| mean | 0.0011ms | 0.0011ms | +0.000027ms | +2.46% |
| min | 0.00054ms | 0.00054ms | 0.00ms | 0.00% |
| max | 0.03ms | 0.01ms | +0.01ms | +122.16% |
| total | 0.23ms | 0.22ms | +0.0055ms | +2.46% |

### defineWorkflow

# Perf Report — defineWorkflow.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.00084ms |
| p99 | 0.0042ms |
| mean | 0.00068ms |
| stdev | 0.0051ms |
| min | 0.00017ms |
| max | 0.07ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00021ms | -0.000041ms | -19.71% |
| p50 | 0.00021ms | 0.00025ms | -0.000042ms | -16.80% |
| p95 | 0.00084ms | 0.00029ms | +0.00055ms | +189.18% |
| p99 | 0.0042ms | 0.0035ms | +0.00063ms | +17.66% |
| mean | 0.00068ms | 0.00032ms | +0.00036ms | +110.68% |
| min | 0.00017ms | 0.00021ms | -0.000042ms | -20.19% |
| max | 0.07ms | 0.0059ms | +0.07ms | +1126.23% |
| total | 0.14ms | 0.06ms | +0.07ms | +110.68% |

### retryStepSucceed

# Perf Report — retryStepSucceed.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00038ms |
| p95 | 0.0010ms |
| p99 | 0.0038ms |
| mean | 0.00051ms |
| stdev | 0.00050ms |
| min | 0.00033ms |
| max | 0.0043ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p50 | 0.00038ms | 0.00042ms | -0.000042ms | -10.07% |
| p95 | 0.0010ms | 0.0013ms | -0.00021ms | -16.69% |
| p99 | 0.0038ms | 0.0037ms | +0.000042ms | +1.14% |
| mean | 0.00051ms | 0.00056ms | -0.000053ms | -9.41% |
| min | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| max | 0.0043ms | 0.01ms | -0.0063ms | -59.37% |
| total | 0.10ms | 0.11ms | -0.01ms | -9.41% |

