# Perf Suite — graphql

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| parseGraphQLOperation | 0.00079ms | 0.0028ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| executeQuery | 0.00088ms | 0.0016ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| clientQuery | 0.00092ms | 0.0018ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| parseGraphQLOperation | 0.02ms | 10ms | PASS |
| executeQuery | 0.02ms | 10ms | PASS |
| clientQuery | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| parseGraphQLOperation | -8072 B | 0 B | 102400 B | yes | PASS |
| executeQuery | 7736 B | 0 B | 102400 B | yes | PASS |
| clientQuery | 29080 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### parseGraphQLOperation

# Perf Report — parseGraphQLOperation.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00079ms |
| p50 | 0.00088ms |
| p95 | 0.0028ms |
| p99 | 0.01ms |
| mean | 0.0014ms |
| stdev | 0.0018ms |
| min | 0.00075ms |
| max | 0.02ms |
| total | 0.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00079ms | 0.00079ms | 0.00ms | 0.00% |
| p50 | 0.00088ms | 0.00083ms | +0.000041ms | +4.98% |
| p95 | 0.0028ms | 0.0025ms | +0.00033ms | +13.19% |
| p99 | 0.01ms | 0.0076ms | +0.0025ms | +32.48% |
| mean | 0.0014ms | 0.0013ms | +0.00012ms | +9.42% |
| min | 0.00075ms | 0.00075ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.0038ms | +29.91% |
| total | 0.28ms | 0.26ms | +0.02ms | +9.42% |

### executeQuery

# Perf Report — executeQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00088ms |
| p50 | 0.0010ms |
| p95 | 0.0016ms |
| p99 | 0.0067ms |
| mean | 0.0012ms |
| stdev | 0.0010ms |
| min | 0.00083ms |
| max | 0.01ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00088ms | 0.00091ms | -0.000037ms | -4.05% |
| p50 | 0.0010ms | 0.0010ms | -0.000041ms | -3.94% |
| p95 | 0.0016ms | 0.0024ms | -0.00074ms | -30.92% |
| p99 | 0.0067ms | 0.0073ms | -0.00065ms | -8.88% |
| mean | 0.0012ms | 0.0013ms | -0.000099ms | -7.58% |
| min | 0.00083ms | 0.00088ms | -0.000042ms | -4.80% |
| max | 0.01ms | 0.01ms | -0.0035ms | -24.43% |
| total | 0.24ms | 0.26ms | -0.02ms | -7.58% |

### clientQuery

# Perf Report — clientQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00092ms |
| p50 | 0.00096ms |
| p95 | 0.0018ms |
| p99 | 0.0080ms |
| mean | 0.0012ms |
| stdev | 0.0012ms |
| min | 0.00083ms |
| max | 0.01ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00092ms | 0.00092ms | 0.00ms | 0.00% |
| p50 | 0.00096ms | 0.00096ms | 0.00ms | 0.00% |
| p95 | 0.0018ms | 0.0018ms | -0.000048ms | -2.63% |
| p99 | 0.0080ms | 0.01ms | -0.0054ms | -40.18% |
| mean | 0.0012ms | 0.0015ms | -0.00037ms | -23.94% |
| min | 0.00083ms | 0.00088ms | -0.000041ms | -4.69% |
| max | 0.01ms | 0.06ms | -0.05ms | -79.58% |
| total | 0.23ms | 0.31ms | -0.07ms | -23.94% |

