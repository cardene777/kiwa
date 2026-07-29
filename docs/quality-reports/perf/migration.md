# Perf Suite — migration

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| runUp | 0.00046ms | 0.0023ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| diffSchema | 0.00096ms | 0.0015ms | 5ms | 0.00033ms | PASS | improved — gate 無効 (regressionGate=false) |
| clientCreate | 0.00017ms | 0.0011ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +201%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| runUp | 0.01ms | 10ms | PASS |
| diffSchema | 0.02ms | 10ms | PASS |
| clientCreate | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| runUp | -261456 B | 0 B | 102400 B | yes | PASS |
| diffSchema | -15136 B | 0 B | 102400 B | yes | PASS |
| clientCreate | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### runUp

# Perf Report — runUp.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.0023ms |
| p99 | 0.0060ms |
| mean | 0.00076ms |
| stdev | 0.00090ms |
| min | 0.00042ms |
| max | 0.0064ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| p50 | 0.00050ms | 0.00054ms | -0.000042ms | -7.75% |
| p95 | 0.0023ms | 0.0022ms | +0.000088ms | +4.06% |
| p99 | 0.0060ms | 0.0068ms | -0.00076ms | -11.18% |
| mean | 0.00076ms | 0.00078ms | -0.000026ms | -3.35% |
| min | 0.00042ms | 0.00042ms | -0.0000010ms | -0.24% |
| max | 0.0064ms | 0.0084ms | -0.0020ms | -23.38% |
| total | 0.15ms | 0.16ms | -0.0052ms | -3.35% |

### diffSchema

# Perf Report — diffSchema.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00096ms |
| p50 | 0.0010ms |
| p95 | 0.0015ms |
| p99 | 0.0053ms |
| mean | 0.0012ms |
| stdev | 0.00069ms |
| min | 0.00096ms |
| max | 0.0080ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00096ms | 0.0013ms | -0.00038ms | -28.13% |
| p50 | 0.0010ms | 0.0013ms | -0.00033ms | -25.04% |
| p95 | 0.0015ms | 0.0026ms | -0.0012ms | -44.26% |
| p99 | 0.0053ms | 0.01ms | -0.0075ms | -58.60% |
| mean | 0.0012ms | 0.0048ms | -0.0036ms | -75.19% |
| min | 0.00096ms | 0.0013ms | -0.00033ms | -25.79% |
| max | 0.0080ms | 0.61ms | -0.61ms | -98.71% |
| total | 0.24ms | 0.97ms | -0.73ms | -75.19% |

### clientCreate

# Perf Report — clientCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.0011ms |
| p99 | 0.0030ms |
| mean | 0.00034ms |
| stdev | 0.00063ms |
| min | 0.00017ms |
| max | 0.0063ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p50 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p95 | 0.0011ms | 0.00029ms | +0.00084ms | +287.97% |
| p99 | 0.0030ms | 0.0016ms | +0.0014ms | +81.94% |
| mean | 0.00034ms | 0.00029ms | +0.000042ms | +14.40% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.0063ms | 0.01ms | -0.0043ms | -40.55% |
| total | 0.07ms | 0.06ms | +0.0085ms | +14.40% |

