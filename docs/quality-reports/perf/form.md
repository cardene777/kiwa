# Perf Suite — form

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| validateSchema | 0.00050ms | 0.0012ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| registerFieldAndSubmit | 0.0053ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| getFieldErrorAfterFailure | 0.0043ms | 0.0057ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| validateSchema | 0.01ms | 10ms | PASS |
| registerFieldAndSubmit | 0.09ms | 10ms | PASS |
| getFieldErrorAfterFailure | 0.08ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| validateSchema | 17936 B | 0 B | 102400 B | yes | PASS |
| registerFieldAndSubmit | -9128 B | 0 B | 102400 B | yes | PASS |
| getFieldErrorAfterFailure | 2544 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### validateSchema

# Perf Report — validateSchema.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.0012ms |
| p99 | 0.0048ms |
| mean | 0.00070ms |
| stdev | 0.00066ms |
| min | 0.00050ms |
| max | 0.0068ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p50 | 0.00054ms | 0.00063ms | -0.000083ms | -13.28% |
| p95 | 0.0012ms | 0.0012ms | +0.0000041ms | +0.34% |
| p99 | 0.0048ms | 0.0021ms | +0.0027ms | +126.02% |
| mean | 0.00070ms | 0.00071ms | -0.0000071ms | -1.01% |
| min | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| max | 0.0068ms | 0.0073ms | -0.00050ms | -6.80% |
| total | 0.14ms | 0.14ms | -0.0014ms | -1.01% |

### registerFieldAndSubmit

# Perf Report — registerFieldAndSubmit.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0053ms |
| p50 | 0.0056ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0064ms |
| stdev | 0.0027ms |
| min | 0.0052ms |
| max | 0.02ms |
| total | 1.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0053ms | 0.0055ms | -0.00017ms | -3.04% |
| p50 | 0.0056ms | 0.0058ms | -0.00025ms | -4.29% |
| p95 | 0.01ms | 0.01ms | -0.00024ms | -2.00% |
| p99 | 0.02ms | 0.02ms | +0.00021ms | +1.11% |
| mean | 0.0064ms | 0.0067ms | -0.00029ms | -4.31% |
| min | 0.0052ms | 0.0053ms | -0.000084ms | -1.59% |
| max | 0.02ms | 0.02ms | +0.0012ms | +5.04% |
| total | 1.28ms | 1.34ms | -0.06ms | -4.31% |

### getFieldErrorAfterFailure

# Perf Report — getFieldErrorAfterFailure.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0043ms |
| p50 | 0.0045ms |
| p95 | 0.0057ms |
| p99 | 0.01ms |
| mean | 0.0048ms |
| stdev | 0.0012ms |
| min | 0.0043ms |
| max | 0.01ms |
| total | 0.96ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0043ms | 0.0043ms | +0.000084ms | +1.97% |
| p50 | 0.0045ms | 0.0044ms | +0.000083ms | +1.88% |
| p95 | 0.0057ms | 0.01ms | -0.0046ms | -44.82% |
| p99 | 0.01ms | 0.02ms | -0.0041ms | -25.21% |
| mean | 0.0048ms | 0.0052ms | -0.00045ms | -8.66% |
| min | 0.0043ms | 0.0041ms | +0.00013ms | +3.03% |
| max | 0.01ms | 0.03ms | -0.01ms | -47.12% |
| total | 0.96ms | 1.05ms | -0.09ms | -8.66% |

