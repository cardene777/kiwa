# Perf Suite — query

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| fetchQuery | 0.00042ms | 0.0018ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| mutate | 0.00067ms | 0.0013ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invalidateQuery | 0.00029ms | 0.00042ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +100%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| fetchQuery | 0.01ms | 10ms | PASS |
| mutate | 0.02ms | 10ms | PASS |
| invalidateQuery | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| fetchQuery | -10536 B | 0 B | 102400 B | yes | PASS |
| mutate | -15192 B | 0 B | 102400 B | yes | PASS |
| invalidateQuery | 688 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### fetchQuery

# Perf Report — fetchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.0018ms |
| p99 | 0.0043ms |
| mean | 0.00072ms |
| stdev | 0.00079ms |
| min | 0.00042ms |
| max | 0.0063ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00050ms | -0.000083ms | -16.60% |
| p50 | 0.00046ms | 0.00063ms | -0.00017ms | -26.56% |
| p95 | 0.0018ms | 0.0021ms | -0.00031ms | -15.06% |
| p99 | 0.0043ms | 0.0051ms | -0.00080ms | -15.60% |
| mean | 0.00072ms | 0.00086ms | -0.00014ms | -16.49% |
| min | 0.00042ms | 0.00046ms | -0.000042ms | -9.17% |
| max | 0.0063ms | 0.0097ms | -0.0035ms | -35.90% |
| total | 0.14ms | 0.17ms | -0.03ms | -16.49% |

### mutate

# Perf Report — mutate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00067ms |
| p50 | 0.00071ms |
| p95 | 0.0013ms |
| p99 | 0.0071ms |
| mean | 0.00091ms |
| stdev | 0.0010ms |
| min | 0.00067ms |
| max | 0.0092ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00067ms | 0.00075ms | -0.000083ms | -11.07% |
| p50 | 0.00071ms | 0.00079ms | -0.000083ms | -10.48% |
| p95 | 0.0013ms | 0.0013ms | -0.000044ms | -3.40% |
| p99 | 0.0071ms | 0.0092ms | -0.0021ms | -22.58% |
| mean | 0.00091ms | 0.0010ms | -0.00010ms | -10.22% |
| min | 0.00067ms | 0.00071ms | -0.000042ms | -5.93% |
| max | 0.0092ms | 0.01ms | -0.0012ms | -11.61% |
| total | 0.18ms | 0.20ms | -0.02ms | -10.22% |

### invalidateQuery

# Perf Report — invalidateQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00031ms |
| p95 | 0.00042ms |
| p99 | 0.0022ms |
| mean | 0.00045ms |
| stdev | 0.0013ms |
| min | 0.00029ms |
| max | 0.02ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| p50 | 0.00031ms | 0.00033ms | -0.000021ms | -6.44% |
| p95 | 0.00042ms | 0.00046ms | -0.000041ms | -8.91% |
| p99 | 0.0022ms | 0.0014ms | +0.00079ms | +56.59% |
| mean | 0.00045ms | 0.00045ms | +4.3e-7ms | +0.10% |
| min | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.0055ms | +43.43% |
| total | 0.09ms | 0.09ms | +0.000086ms | +0.10% |

