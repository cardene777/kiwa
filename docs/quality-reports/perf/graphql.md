# Perf Suite — graphql

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| parseGraphQLOperation | 0.00092ms | 0.0019ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| executeQuery | 0.00096ms | 0.0025ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| clientQuery | 0.00088ms | 0.0014ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| parseGraphQLOperation | 0.02ms | 10ms | PASS |
| executeQuery | 0.02ms | 10ms | PASS |
| clientQuery | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| parseGraphQLOperation | -1904 B | 0 B | 102400 B | yes | PASS |
| executeQuery | 44912 B | 0 B | 102400 B | yes | PASS |
| clientQuery | 38960 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### parseGraphQLOperation

# Perf Report — parseGraphQLOperation.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00092ms |
| p50 | 0.0010ms |
| p95 | 0.0019ms |
| p99 | 0.0081ms |
| mean | 0.0013ms |
| stdev | 0.0014ms |
| min | 0.00083ms |
| max | 0.01ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00092ms | 0.00079ms | +0.00013ms | +15.80% |
| p50 | 0.0010ms | 0.00083ms | +0.00017ms | +19.98% |
| p95 | 0.0019ms | 0.0025ms | -0.00059ms | -23.53% |
| p99 | 0.0081ms | 0.0076ms | +0.00050ms | +6.54% |
| mean | 0.0013ms | 0.0013ms | -0.000023ms | -1.80% |
| min | 0.00083ms | 0.00075ms | +0.000083ms | +11.07% |
| max | 0.01ms | 0.01ms | +0.0018ms | +13.96% |
| total | 0.25ms | 0.26ms | -0.0046ms | -1.80% |

### executeQuery

# Perf Report — executeQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00096ms |
| p50 | 0.0010ms |
| p95 | 0.0025ms |
| p99 | 0.01ms |
| mean | 0.0024ms |
| stdev | 0.02ms |
| min | 0.00092ms |
| max | 0.22ms |
| total | 0.48ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00096ms | 0.00091ms | +0.000046ms | +5.06% |
| p50 | 0.0010ms | 0.0010ms | -0.000041ms | -3.94% |
| p95 | 0.0025ms | 0.0024ms | +0.00014ms | +5.94% |
| p99 | 0.01ms | 0.0073ms | +0.0028ms | +38.83% |
| mean | 0.0024ms | 0.0013ms | +0.0011ms | +84.37% |
| min | 0.00092ms | 0.00088ms | +0.000041ms | +4.69% |
| max | 0.22ms | 0.01ms | +0.21ms | +1421.84% |
| total | 0.48ms | 0.26ms | +0.22ms | +84.37% |

### clientQuery

# Perf Report — clientQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00088ms |
| p50 | 0.00092ms |
| p95 | 0.0014ms |
| p99 | 0.0040ms |
| mean | 0.0015ms |
| stdev | 0.0065ms |
| min | 0.00083ms |
| max | 0.09ms |
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00088ms | 0.00092ms | -0.000041ms | -4.48% |
| p50 | 0.00092ms | 0.00096ms | -0.000041ms | -4.28% |
| p95 | 0.0014ms | 0.0018ms | -0.00046ms | -25.24% |
| p99 | 0.0040ms | 0.01ms | -0.0093ms | -69.92% |
| mean | 0.0015ms | 0.0015ms | -0.000053ms | -3.43% |
| min | 0.00083ms | 0.00088ms | -0.000042ms | -4.80% |
| max | 0.09ms | 0.06ms | +0.03ms | +48.79% |
| total | 0.30ms | 0.31ms | -0.01ms | -3.43% |

