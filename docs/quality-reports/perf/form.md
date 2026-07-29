# Perf Suite — form

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| validateSchema | 0.00050ms | 0.0016ms | 5ms | 0.00033ms | PASS | stable (p10 0% (閾値未満)、 p95 +35% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| registerFieldAndSubmit | 0.0057ms | 0.02ms | 5ms | 0.00033ms | PASS | stable (p10 +3% (閾値未満)、 p95 +43% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| getFieldErrorAfterFailure | 0.0049ms | 0.0084ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| validateSchema | 0.01ms | 10ms | PASS |
| registerFieldAndSubmit | 0.10ms | 10ms | PASS |
| getFieldErrorAfterFailure | 0.07ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| validateSchema | 239136 B | 0 B | 102400 B | yes | PASS |
| registerFieldAndSubmit | -10528 B | 0 B | 102400 B | yes | PASS |
| getFieldErrorAfterFailure | 2880 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### validateSchema

# Perf Report — validateSchema.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00058ms |
| p95 | 0.0016ms |
| p99 | 0.0070ms |
| mean | 0.00082ms |
| stdev | 0.00090ms |
| min | 0.00046ms |
| max | 0.0079ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p50 | 0.00058ms | 0.00063ms | -0.000041ms | -6.56% |
| p95 | 0.0016ms | 0.0012ms | +0.00042ms | +34.51% |
| p99 | 0.0070ms | 0.0021ms | +0.0048ms | +228.14% |
| mean | 0.00082ms | 0.00071ms | +0.00012ms | +16.52% |
| min | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| max | 0.0079ms | 0.0073ms | +0.00058ms | +7.96% |
| total | 0.16ms | 0.14ms | +0.02ms | +16.52% |

### registerFieldAndSubmit

# Perf Report — registerFieldAndSubmit.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0057ms |
| p50 | 0.0069ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0087ms |
| stdev | 0.01ms |
| min | 0.0055ms |
| max | 0.14ms |
| total | 1.74ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0057ms | 0.0055ms | +0.00017ms | +3.03% |
| p50 | 0.0069ms | 0.0058ms | +0.0011ms | +18.21% |
| p95 | 0.02ms | 0.01ms | +0.0051ms | +42.72% |
| p99 | 0.02ms | 0.02ms | +0.0061ms | +32.76% |
| mean | 0.0087ms | 0.0067ms | +0.0020ms | +30.00% |
| min | 0.0055ms | 0.0053ms | +0.00017ms | +3.14% |
| max | 0.14ms | 0.02ms | +0.12ms | +499.63% |
| total | 1.74ms | 1.34ms | +0.40ms | +30.00% |

### getFieldErrorAfterFailure

# Perf Report — getFieldErrorAfterFailure.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0049ms |
| p50 | 0.0051ms |
| p95 | 0.0084ms |
| p99 | 0.01ms |
| mean | 0.0063ms |
| stdev | 0.01ms |
| min | 0.0048ms |
| max | 0.16ms |
| total | 1.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0049ms | 0.0043ms | +0.00062ms | +14.71% |
| p50 | 0.0051ms | 0.0044ms | +0.00067ms | +15.08% |
| p95 | 0.0084ms | 0.01ms | -0.0019ms | -18.91% |
| p99 | 0.01ms | 0.02ms | -0.0024ms | -14.92% |
| mean | 0.0063ms | 0.0052ms | +0.0011ms | +20.23% |
| min | 0.0048ms | 0.0041ms | +0.00067ms | +16.17% |
| max | 0.16ms | 0.03ms | +0.14ms | +498.79% |
| total | 1.26ms | 1.05ms | +0.21ms | +20.23% |

