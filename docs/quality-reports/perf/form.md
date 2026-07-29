# Perf Suite — form

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| validateSchema | 0.00050ms | 0.0015ms | 5ms | 0.00033ms | PASS | stable (p10 0% (閾値未満)、 p95 +25% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| registerFieldAndSubmit | 0.0056ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| getFieldErrorAfterFailure | 0.0042ms | 0.0071ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| validateSchema | 0.01ms | 10ms | PASS |
| registerFieldAndSubmit | 0.10ms | 10ms | PASS |
| getFieldErrorAfterFailure | 0.08ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| validateSchema | 9184 B | 0 B | 102400 B | yes | PASS |
| registerFieldAndSubmit | -10376 B | 0 B | 102400 B | yes | PASS |
| getFieldErrorAfterFailure | 2432 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### validateSchema

# Perf Report — validateSchema.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.0015ms |
| p99 | 0.0087ms |
| mean | 0.00097ms |
| stdev | 0.0023ms |
| min | 0.00050ms |
| max | 0.03ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p50 | 0.00054ms | 0.00063ms | -0.000083ms | -13.28% |
| p95 | 0.0015ms | 0.0012ms | +0.00030ms | +25.20% |
| p99 | 0.0087ms | 0.0021ms | +0.0066ms | +310.58% |
| mean | 0.00097ms | 0.00071ms | +0.00026ms | +36.70% |
| min | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| max | 0.03ms | 0.0073ms | +0.02ms | +270.46% |
| total | 0.19ms | 0.14ms | +0.05ms | +36.70% |

### registerFieldAndSubmit

# Perf Report — registerFieldAndSubmit.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0056ms |
| p50 | 0.0059ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0073ms |
| stdev | 0.0077ms |
| min | 0.0054ms |
| max | 0.11ms |
| total | 1.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0056ms | 0.0055ms | +0.000083ms | +1.51% |
| p50 | 0.0059ms | 0.0058ms | +0.000041ms | +0.71% |
| p95 | 0.01ms | 0.01ms | +0.00034ms | +2.85% |
| p99 | 0.02ms | 0.02ms | +0.0035ms | +18.90% |
| mean | 0.0073ms | 0.0067ms | +0.00060ms | +8.93% |
| min | 0.0054ms | 0.0053ms | +0.000083ms | +1.57% |
| max | 0.11ms | 0.02ms | +0.08ms | +366.18% |
| total | 1.46ms | 1.34ms | +0.12ms | +8.93% |

### getFieldErrorAfterFailure

# Perf Report — getFieldErrorAfterFailure.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0042ms |
| p50 | 0.0043ms |
| p95 | 0.0071ms |
| p99 | 0.01ms |
| mean | 0.0049ms |
| stdev | 0.0018ms |
| min | 0.0041ms |
| max | 0.02ms |
| total | 0.98ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0042ms | 0.0043ms | -0.000042ms | -0.99% |
| p50 | 0.0043ms | 0.0044ms | -0.000083ms | -1.88% |
| p95 | 0.0071ms | 0.01ms | -0.0032ms | -30.83% |
| p99 | 0.01ms | 0.02ms | -0.0013ms | -8.37% |
| mean | 0.0049ms | 0.0052ms | -0.00035ms | -6.77% |
| min | 0.0041ms | 0.0041ms | -0.000042ms | -1.02% |
| max | 0.02ms | 0.03ms | -0.01ms | -40.61% |
| total | 0.98ms | 1.05ms | -0.07ms | -6.77% |

