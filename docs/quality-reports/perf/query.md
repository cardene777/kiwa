# Perf Suite — query

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| fetchQuery | 0.00046ms | 0.0023ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| mutate | 0.00075ms | 0.0011ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invalidateQuery | 0.00029ms | 0.00042ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| fetchQuery | 0.01ms | 10ms | PASS |
| mutate | 0.02ms | 10ms | PASS |
| invalidateQuery | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| fetchQuery | -1048 B | 0 B | 102400 B | yes | PASS |
| mutate | 21440 B | 0 B | 102400 B | yes | PASS |
| invalidateQuery | 688 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### fetchQuery

# Perf Report — fetchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00063ms |
| p95 | 0.0023ms |
| p99 | 0.0044ms |
| mean | 0.00090ms |
| stdev | 0.00085ms |
| min | 0.00042ms |
| max | 0.0070ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| p50 | 0.00063ms | 0.00063ms | 0.00ms | 0.00% |
| p95 | 0.0023ms | 0.0021ms | +0.00019ms | +9.28% |
| p99 | 0.0044ms | 0.0051ms | -0.00067ms | -13.15% |
| mean | 0.00090ms | 0.00086ms | +0.000041ms | +4.80% |
| min | 0.00042ms | 0.00046ms | -0.000041ms | -8.95% |
| max | 0.0070ms | 0.0097ms | -0.0027ms | -28.21% |
| total | 0.18ms | 0.17ms | +0.0082ms | +4.80% |

### mutate

# Perf Report — mutate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00075ms |
| p50 | 0.00083ms |
| p95 | 0.0011ms |
| p99 | 0.0074ms |
| mean | 0.0010ms |
| stdev | 0.0010ms |
| min | 0.00075ms |
| max | 0.0092ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00075ms | 0.00075ms | 0.00ms | 0.00% |
| p50 | 0.00083ms | 0.00079ms | +0.000041ms | +5.18% |
| p95 | 0.0011ms | 0.0013ms | -0.00022ms | -16.58% |
| p99 | 0.0074ms | 0.0092ms | -0.0018ms | -19.40% |
| mean | 0.0010ms | 0.0010ms | -0.000023ms | -2.22% |
| min | 0.00075ms | 0.00071ms | +0.000042ms | +5.93% |
| max | 0.0092ms | 0.01ms | -0.0012ms | -11.20% |
| total | 0.20ms | 0.20ms | -0.0045ms | -2.22% |

### invalidateQuery

# Perf Report — invalidateQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00042ms |
| p99 | 0.0016ms |
| mean | 0.00042ms |
| stdev | 0.0011ms |
| min | 0.00029ms |
| max | 0.02ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| p50 | 0.00033ms | 0.00033ms | -0.0000010ms | -0.30% |
| p95 | 0.00042ms | 0.00046ms | -0.000042ms | -9.15% |
| p99 | 0.0016ms | 0.0014ms | +0.00016ms | +11.27% |
| mean | 0.00042ms | 0.00045ms | -0.000025ms | -5.49% |
| min | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.0024ms | +19.08% |
| total | 0.08ms | 0.09ms | -0.0049ms | -5.49% |

