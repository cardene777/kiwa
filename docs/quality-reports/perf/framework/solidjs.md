# Perf Suite — solidjs

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| renderSolid | 0.00063ms | 0.0013ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| mockSignalEffect | 0.00092ms | 0.0015ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| renderSolid | 0.02ms | 10ms | PASS |
| mockSignalEffect | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| renderSolid | -12488 B | 0 B | 102400 B | yes | PASS |
| mockSignalEffect | 5192 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### renderSolid

# Perf Report — renderSolid.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00063ms |
| p50 | 0.00067ms |
| p95 | 0.0013ms |
| p99 | 0.0046ms |
| mean | 0.00082ms |
| stdev | 0.00064ms |
| min | 0.00063ms |
| max | 0.0060ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00063ms | 0.00063ms | 0.00ms | 0.00% |
| p50 | 0.00067ms | 0.00067ms | 0.00ms | 0.00% |
| p95 | 0.0013ms | 0.0015ms | -0.00020ms | -12.99% |
| p99 | 0.0046ms | 0.0048ms | -0.00025ms | -5.08% |
| mean | 0.00082ms | 0.00083ms | -0.000015ms | -1.75% |
| min | 0.00063ms | 0.00058ms | +0.000042ms | +7.20% |
| max | 0.0060ms | 0.0066ms | -0.00063ms | -9.51% |
| total | 0.16ms | 0.17ms | -0.0029ms | -1.75% |

### mockSignalEffect

# Perf Report — mockSignalEffect.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00092ms |
| p50 | 0.00096ms |
| p95 | 0.0015ms |
| p99 | 0.0053ms |
| mean | 0.0012ms |
| stdev | 0.00091ms |
| min | 0.00088ms |
| max | 0.0091ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00092ms | 0.00096ms | -0.000042ms | -4.38% |
| p50 | 0.00096ms | 0.0010ms | -0.000042ms | -4.20% |
| p95 | 0.0015ms | 0.0018ms | -0.00028ms | -15.60% |
| p99 | 0.0053ms | 0.0057ms | -0.00040ms | -7.02% |
| mean | 0.0012ms | 0.0013ms | -0.000072ms | -5.61% |
| min | 0.00088ms | 0.00092ms | -0.000041ms | -4.48% |
| max | 0.0091ms | 0.01ms | -0.0034ms | -27.34% |
| total | 0.24ms | 0.26ms | -0.01ms | -5.61% |

