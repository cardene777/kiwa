# Perf Suite — graphql

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| parseGraphQLOperation | 0.00079ms | 0.0019ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| executeQuery | 0.00088ms | 0.0026ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| clientQuery | 0.00088ms | 0.0012ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| parseGraphQLOperation | 0.03ms | 10ms | PASS |
| executeQuery | 0.02ms | 10ms | PASS |
| clientQuery | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| parseGraphQLOperation | -133496 B | 0 B | 102400 B | yes | PASS |
| executeQuery | 7944 B | 0 B | 102400 B | yes | PASS |
| clientQuery | 28064 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### parseGraphQLOperation

# Perf Report — parseGraphQLOperation.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00079ms |
| p50 | 0.00083ms |
| p95 | 0.0019ms |
| p99 | 0.0079ms |
| mean | 0.0012ms |
| stdev | 0.0016ms |
| min | 0.00079ms |
| max | 0.01ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00079ms | 0.00079ms | +0.0000010ms | +0.13% |
| p50 | 0.00083ms | 0.00083ms | +5.0e-7ms | +0.06% |
| p95 | 0.0019ms | 0.0025ms | -0.00064ms | -25.36% |
| p99 | 0.0079ms | 0.0076ms | +0.00032ms | +4.21% |
| mean | 0.0012ms | 0.0013ms | -0.000084ms | -6.54% |
| min | 0.00079ms | 0.00075ms | +0.000041ms | +5.47% |
| max | 0.01ms | 0.01ms | +0.0025ms | +19.61% |
| total | 0.24ms | 0.26ms | -0.02ms | -6.54% |

### executeQuery

# Perf Report — executeQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00088ms |
| p50 | 0.00096ms |
| p95 | 0.0026ms |
| p99 | 0.01ms |
| mean | 0.0014ms |
| stdev | 0.0027ms |
| min | 0.00083ms |
| max | 0.03ms |
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00088ms | 0.00091ms | -0.000037ms | -4.05% |
| p50 | 0.00096ms | 0.0010ms | -0.000083ms | -7.97% |
| p95 | 0.0026ms | 0.0024ms | +0.00020ms | +8.41% |
| p99 | 0.01ms | 0.0073ms | +0.0049ms | +66.58% |
| mean | 0.0014ms | 0.0013ms | +0.00013ms | +9.60% |
| min | 0.00083ms | 0.00088ms | -0.000042ms | -4.80% |
| max | 0.03ms | 0.01ms | +0.02ms | +108.33% |
| total | 0.29ms | 0.26ms | +0.03ms | +9.60% |

### clientQuery

# Perf Report — clientQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00088ms |
| p50 | 0.00092ms |
| p95 | 0.0012ms |
| p99 | 0.0034ms |
| mean | 0.0010ms |
| stdev | 0.00081ms |
| min | 0.00083ms |
| max | 0.01ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00088ms | 0.00092ms | -0.000041ms | -4.48% |
| p50 | 0.00092ms | 0.00096ms | -0.000041ms | -4.28% |
| p95 | 0.0012ms | 0.0018ms | -0.00063ms | -34.32% |
| p99 | 0.0034ms | 0.01ms | -0.010ms | -74.63% |
| mean | 0.0010ms | 0.0015ms | -0.00051ms | -33.30% |
| min | 0.00083ms | 0.00088ms | -0.000041ms | -4.69% |
| max | 0.01ms | 0.06ms | -0.05ms | -81.54% |
| total | 0.21ms | 0.31ms | -0.10ms | -33.30% |

