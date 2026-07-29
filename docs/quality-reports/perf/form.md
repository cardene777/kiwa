# Perf Suite — form

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| validateSchema | 0.00050ms | 0.0013ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| registerFieldAndSubmit | 0.0055ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| getFieldErrorAfterFailure | 0.0043ms | 0.0064ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| validateSchema | 0.01ms | 10ms | PASS |
| registerFieldAndSubmit | 0.10ms | 10ms | PASS |
| getFieldErrorAfterFailure | 0.06ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| validateSchema | 117760 B | 0 B | 102400 B | yes | PASS |
| registerFieldAndSubmit | -9184 B | 0 B | 102400 B | yes | PASS |
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
| p95 | 0.0013ms |
| p99 | 0.0031ms |
| mean | 0.00070ms |
| stdev | 0.00065ms |
| min | 0.00046ms |
| max | 0.0070ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p50 | 0.00054ms | 0.00063ms | -0.000083ms | -13.28% |
| p95 | 0.0013ms | 0.0012ms | +0.000042ms | +3.47% |
| p99 | 0.0031ms | 0.0021ms | +0.00098ms | +46.31% |
| mean | 0.00070ms | 0.00071ms | -0.0000044ms | -0.62% |
| min | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| max | 0.0070ms | 0.0073ms | -0.00029ms | -3.97% |
| total | 0.14ms | 0.14ms | -0.00087ms | -0.62% |

### registerFieldAndSubmit

# Perf Report — registerFieldAndSubmit.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0055ms |
| p50 | 0.0058ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0066ms |
| stdev | 0.0025ms |
| min | 0.0053ms |
| max | 0.02ms |
| total | 1.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0055ms | 0.0055ms | 0.00ms | 0.00% |
| p50 | 0.0058ms | 0.0058ms | -0.000021ms | -0.36% |
| p95 | 0.01ms | 0.01ms | -0.00042ms | -3.53% |
| p99 | 0.02ms | 0.02ms | +0.0016ms | +8.35% |
| mean | 0.0066ms | 0.0067ms | -0.000096ms | -1.44% |
| min | 0.0053ms | 0.0053ms | +0.000042ms | +0.79% |
| max | 0.02ms | 0.02ms | -0.00063ms | -2.70% |
| total | 1.32ms | 1.34ms | -0.02ms | -1.44% |

### getFieldErrorAfterFailure

# Perf Report — getFieldErrorAfterFailure.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0043ms |
| p50 | 0.0045ms |
| p95 | 0.0064ms |
| p99 | 0.01ms |
| mean | 0.0048ms |
| stdev | 0.0012ms |
| min | 0.0041ms |
| max | 0.01ms |
| total | 0.95ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0043ms | 0.0043ms | 0.00ms | 0.00% |
| p50 | 0.0045ms | 0.0044ms | +0.000083ms | +1.88% |
| p95 | 0.0064ms | 0.01ms | -0.0039ms | -37.52% |
| p99 | 0.01ms | 0.02ms | -0.0043ms | -26.49% |
| mean | 0.0048ms | 0.0052ms | -0.00046ms | -8.77% |
| min | 0.0041ms | 0.0041ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.03ms | -0.02ms | -55.30% |
| total | 0.95ms | 1.05ms | -0.09ms | -8.77% |

