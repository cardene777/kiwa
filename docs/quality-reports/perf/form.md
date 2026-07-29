# Perf Suite — form

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| validateSchema | 0.00050ms | 0.0015ms | 5ms | 0.00033ms | PASS | stable (p10 0% (閾値未満)、 p95 +28% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| registerFieldAndSubmit | 0.0055ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| getFieldErrorAfterFailure | 0.0041ms | 0.0053ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| validateSchema | 0.01ms | 10ms | PASS |
| registerFieldAndSubmit | 0.08ms | 10ms | PASS |
| getFieldErrorAfterFailure | 0.05ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| validateSchema | -4272 B | 0 B | 102400 B | yes | PASS |
| registerFieldAndSubmit | -9280 B | 0 B | 102400 B | yes | PASS |
| getFieldErrorAfterFailure | 3024 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### validateSchema

# Perf Report — validateSchema.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00058ms |
| p95 | 0.0015ms |
| p99 | 0.0057ms |
| mean | 0.00082ms |
| stdev | 0.0014ms |
| min | 0.00050ms |
| max | 0.02ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p50 | 0.00058ms | 0.00063ms | -0.000042ms | -6.72% |
| p95 | 0.0015ms | 0.0012ms | +0.00034ms | +28.16% |
| p99 | 0.0057ms | 0.0021ms | +0.0036ms | +170.37% |
| mean | 0.00082ms | 0.00071ms | +0.00011ms | +15.69% |
| min | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.0073ms | +0.0089ms | +121.60% |
| total | 0.16ms | 0.14ms | +0.02ms | +15.69% |

### registerFieldAndSubmit

# Perf Report — registerFieldAndSubmit.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0055ms |
| p50 | 0.0057ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0077ms |
| stdev | 0.01ms |
| min | 0.0053ms |
| max | 0.13ms |
| total | 1.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0055ms | 0.0055ms | -0.000042ms | -0.76% |
| p50 | 0.0057ms | 0.0058ms | -0.00013ms | -2.15% |
| p95 | 0.01ms | 0.01ms | +0.0018ms | +14.87% |
| p99 | 0.03ms | 0.02ms | +0.0065ms | +34.74% |
| mean | 0.0077ms | 0.0067ms | +0.00098ms | +14.63% |
| min | 0.0053ms | 0.0053ms | +0.000041ms | +0.77% |
| max | 0.13ms | 0.02ms | +0.11ms | +469.96% |
| total | 1.54ms | 1.34ms | +0.20ms | +14.63% |

### getFieldErrorAfterFailure

# Perf Report — getFieldErrorAfterFailure.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0041ms |
| p50 | 0.0042ms |
| p95 | 0.0053ms |
| p99 | 0.01ms |
| mean | 0.0045ms |
| stdev | 0.0011ms |
| min | 0.0040ms |
| max | 0.01ms |
| total | 0.89ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0041ms | 0.0043ms | -0.00017ms | -3.91% |
| p50 | 0.0042ms | 0.0044ms | -0.00021ms | -4.73% |
| p95 | 0.0053ms | 0.01ms | -0.0050ms | -48.88% |
| p99 | 0.01ms | 0.02ms | -0.0052ms | -32.18% |
| mean | 0.0045ms | 0.0052ms | -0.00077ms | -14.67% |
| min | 0.0040ms | 0.0041ms | -0.00017ms | -4.05% |
| max | 0.01ms | 0.03ms | -0.02ms | -56.21% |
| total | 0.89ms | 1.05ms | -0.15ms | -14.67% |

