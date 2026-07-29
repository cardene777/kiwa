# Perf Suite — query

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| fetchQuery | 0.00042ms | 0.0019ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| mutate | 0.00067ms | 0.0012ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
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
| fetchQuery | -12056 B | 0 B | 102400 B | yes | PASS |
| mutate | -16216 B | 0 B | 102400 B | yes | PASS |
| invalidateQuery | 592 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### fetchQuery

# Perf Report — fetchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00050ms |
| p95 | 0.0019ms |
| p99 | 0.0055ms |
| mean | 0.00076ms |
| stdev | 0.00097ms |
| min | 0.00042ms |
| max | 0.0077ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00050ms | -0.000083ms | -16.60% |
| p50 | 0.00050ms | 0.00063ms | -0.00013ms | -20.00% |
| p95 | 0.0019ms | 0.0021ms | -0.00013ms | -6.51% |
| p99 | 0.0055ms | 0.0051ms | +0.00038ms | +7.44% |
| mean | 0.00076ms | 0.00086ms | -0.00010ms | -11.84% |
| min | 0.00042ms | 0.00046ms | -0.000042ms | -9.17% |
| max | 0.0077ms | 0.0097ms | -0.0020ms | -20.94% |
| total | 0.15ms | 0.17ms | -0.02ms | -11.84% |

### mutate

# Perf Report — mutate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00067ms |
| p50 | 0.00071ms |
| p95 | 0.0012ms |
| p99 | 0.0078ms |
| mean | 0.0011ms |
| stdev | 0.0037ms |
| min | 0.00063ms |
| max | 0.05ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00067ms | 0.00075ms | -0.000084ms | -11.20% |
| p50 | 0.00071ms | 0.00079ms | -0.000084ms | -10.61% |
| p95 | 0.0012ms | 0.0013ms | -0.00013ms | -9.79% |
| p99 | 0.0078ms | 0.0092ms | -0.0014ms | -14.95% |
| mean | 0.0011ms | 0.0010ms | +0.00011ms | +10.58% |
| min | 0.00063ms | 0.00071ms | -0.000083ms | -11.72% |
| max | 0.05ms | 0.01ms | +0.04ms | +400.78% |
| total | 0.23ms | 0.20ms | +0.02ms | +10.58% |

### invalidateQuery

# Perf Report — invalidateQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00042ms |
| p99 | 0.0022ms |
| mean | 0.00045ms |
| stdev | 0.0014ms |
| min | 0.00029ms |
| max | 0.02ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| p50 | 0.00033ms | 0.00033ms | -0.0000010ms | -0.30% |
| p95 | 0.00042ms | 0.00046ms | -0.000040ms | -8.70% |
| p99 | 0.0022ms | 0.0014ms | +0.00079ms | +56.51% |
| mean | 0.00045ms | 0.00045ms | +0.0000027ms | +0.61% |
| min | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.0065ms | +50.99% |
| total | 0.09ms | 0.09ms | +0.00055ms | +0.61% |

