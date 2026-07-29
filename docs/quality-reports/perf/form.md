# Perf Suite — form

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| validateSchema | 0.00054ms | 0.00097ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| registerFieldAndSubmit | 0.0057ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| getFieldErrorAfterFailure | 0.0044ms | 0.0093ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| validateSchema | 0.01ms | 10ms | PASS |
| registerFieldAndSubmit | 0.09ms | 10ms | PASS |
| getFieldErrorAfterFailure | 0.06ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| validateSchema | -13640 B | 0 B | 102400 B | yes | PASS |
| registerFieldAndSubmit | 6024 B | 0 B | 102400 B | yes | PASS |
| getFieldErrorAfterFailure | 3024 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### validateSchema

# Perf Report — validateSchema.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00063ms |
| p95 | 0.00097ms |
| p99 | 0.0042ms |
| mean | 0.00071ms |
| stdev | 0.00066ms |
| min | 0.00050ms |
| max | 0.0073ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00050ms | +0.000041ms | +8.20% |
| p50 | 0.00063ms | 0.00063ms | 0.00ms | 0.00% |
| p95 | 0.00097ms | 0.0012ms | -0.00024ms | -19.66% |
| p99 | 0.0042ms | 0.0021ms | +0.0021ms | +98.82% |
| mean | 0.00071ms | 0.00071ms | +0.0000051ms | +0.73% |
| min | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| max | 0.0073ms | 0.0073ms | -0.000042ms | -0.57% |
| total | 0.14ms | 0.14ms | +0.0010ms | +0.73% |

### registerFieldAndSubmit

# Perf Report — registerFieldAndSubmit.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0057ms |
| p50 | 0.0060ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0067ms |
| stdev | 0.0024ms |
| min | 0.0055ms |
| max | 0.02ms |
| total | 1.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0057ms | 0.0055ms | +0.00016ms | +2.94% |
| p50 | 0.0060ms | 0.0058ms | +0.00015ms | +2.50% |
| p95 | 0.01ms | 0.01ms | -0.00075ms | -6.38% |
| p99 | 0.02ms | 0.02ms | -0.00022ms | -1.17% |
| mean | 0.0067ms | 0.0067ms | -4.5e-7ms | -0.01% |
| min | 0.0055ms | 0.0053ms | +0.00021ms | +3.93% |
| max | 0.02ms | 0.02ms | -0.0024ms | -10.43% |
| total | 1.34ms | 1.34ms | -0.000091ms | -0.01% |

### getFieldErrorAfterFailure

# Perf Report — getFieldErrorAfterFailure.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0044ms |
| p50 | 0.0047ms |
| p95 | 0.0093ms |
| p99 | 0.01ms |
| mean | 0.0055ms |
| stdev | 0.0025ms |
| min | 0.0041ms |
| max | 0.03ms |
| total | 1.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0044ms | 0.0043ms | +0.00016ms | +3.81% |
| p50 | 0.0047ms | 0.0044ms | +0.00025ms | +5.66% |
| p95 | 0.0093ms | 0.01ms | -0.0010ms | -10.03% |
| p99 | 0.01ms | 0.02ms | -0.0032ms | -20.12% |
| mean | 0.0055ms | 0.0052ms | +0.00023ms | +4.38% |
| min | 0.0041ms | 0.0041ms | -0.000041ms | -0.99% |
| max | 0.03ms | 0.03ms | +0.0029ms | +10.61% |
| total | 1.09ms | 1.05ms | +0.05ms | +4.38% |

