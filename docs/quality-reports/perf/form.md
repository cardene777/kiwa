# Perf Suite — form

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| validateSchema | 0.00050ms | 0.0020ms | 5ms | 0.00033ms | PASS | stable (p10 0% (閾値未満)、 p95 +66% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| registerFieldAndSubmit | 0.0054ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| getFieldErrorAfterFailure | 0.0040ms | 0.0057ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| validateSchema | 0.01ms | 10ms | PASS |
| registerFieldAndSubmit | 0.09ms | 10ms | PASS |
| getFieldErrorAfterFailure | 0.07ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| validateSchema | -6856 B | 0 B | 102400 B | yes | PASS |
| registerFieldAndSubmit | -9280 B | 0 B | 102400 B | yes | PASS |
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
| p95 | 0.0020ms |
| p99 | 0.0063ms |
| mean | 0.00086ms |
| stdev | 0.0010ms |
| min | 0.00050ms |
| max | 0.0085ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p50 | 0.00054ms | 0.00063ms | -0.000083ms | -13.28% |
| p95 | 0.0020ms | 0.0012ms | +0.00079ms | +65.56% |
| p99 | 0.0063ms | 0.0021ms | +0.0042ms | +198.45% |
| mean | 0.00086ms | 0.00071ms | +0.00015ms | +21.90% |
| min | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| max | 0.0085ms | 0.0073ms | +0.0012ms | +16.49% |
| total | 0.17ms | 0.14ms | +0.03ms | +21.90% |

### registerFieldAndSubmit

# Perf Report — registerFieldAndSubmit.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0054ms |
| p50 | 0.0057ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0072ms |
| stdev | 0.0062ms |
| min | 0.0053ms |
| max | 0.08ms |
| total | 1.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0054ms | 0.0055ms | -0.000083ms | -1.51% |
| p50 | 0.0057ms | 0.0058ms | -0.00012ms | -2.13% |
| p95 | 0.01ms | 0.01ms | +0.0013ms | +10.73% |
| p99 | 0.03ms | 0.02ms | +0.0067ms | +36.09% |
| mean | 0.0072ms | 0.0067ms | +0.00052ms | +7.70% |
| min | 0.0053ms | 0.0053ms | -0.0000010ms | -0.02% |
| max | 0.08ms | 0.02ms | +0.06ms | +247.12% |
| total | 1.44ms | 1.34ms | +0.10ms | +7.70% |

### getFieldErrorAfterFailure

# Perf Report — getFieldErrorAfterFailure.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0040ms |
| p50 | 0.0042ms |
| p95 | 0.0057ms |
| p99 | 0.01ms |
| mean | 0.0044ms |
| stdev | 0.0010ms |
| min | 0.0040ms |
| max | 0.01ms |
| total | 0.89ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0040ms | 0.0043ms | -0.00021ms | -4.89% |
| p50 | 0.0042ms | 0.0044ms | -0.00025ms | -5.66% |
| p95 | 0.0057ms | 0.01ms | -0.0046ms | -44.54% |
| p99 | 0.01ms | 0.02ms | -0.0058ms | -36.06% |
| mean | 0.0044ms | 0.0052ms | -0.00080ms | -15.29% |
| min | 0.0040ms | 0.0041ms | -0.00017ms | -4.05% |
| max | 0.01ms | 0.03ms | -0.02ms | -56.51% |
| total | 0.89ms | 1.05ms | -0.16ms | -15.29% |

