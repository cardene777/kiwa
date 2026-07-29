# Perf Suite — graphql

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| parseGraphQLOperation | 0.00079ms | 0.0021ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| executeQuery | 0.00088ms | 0.0020ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| clientQuery | 0.00088ms | 0.0012ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| parseGraphQLOperation | 0.02ms | 10ms | PASS |
| executeQuery | 0.02ms | 10ms | PASS |
| clientQuery | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| parseGraphQLOperation | -177848 B | 0 B | 102400 B | yes | PASS |
| executeQuery | 7712 B | 0 B | 102400 B | yes | PASS |
| clientQuery | 28160 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### parseGraphQLOperation

# Perf Report — parseGraphQLOperation.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00079ms |
| p50 | 0.00088ms |
| p95 | 0.0021ms |
| p99 | 0.0073ms |
| mean | 0.0012ms |
| stdev | 0.0015ms |
| min | 0.00075ms |
| max | 0.01ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00079ms | 0.00079ms | +0.0000010ms | +0.13% |
| p50 | 0.00088ms | 0.00083ms | +0.000041ms | +4.98% |
| p95 | 0.0021ms | 0.0025ms | -0.00043ms | -17.00% |
| p99 | 0.0073ms | 0.0076ms | -0.00029ms | -3.87% |
| mean | 0.0012ms | 0.0013ms | -0.000089ms | -6.97% |
| min | 0.00075ms | 0.00075ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.0019ms | +15.29% |
| total | 0.24ms | 0.26ms | -0.02ms | -6.97% |

### executeQuery

# Perf Report — executeQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00088ms |
| p50 | 0.00096ms |
| p95 | 0.0020ms |
| p99 | 0.0073ms |
| mean | 0.0012ms |
| stdev | 0.0011ms |
| min | 0.00083ms |
| max | 0.01ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00088ms | 0.00091ms | -0.000037ms | -4.05% |
| p50 | 0.00096ms | 0.0010ms | -0.000083ms | -7.97% |
| p95 | 0.0020ms | 0.0024ms | -0.00041ms | -17.40% |
| p99 | 0.0073ms | 0.0073ms | -0.000071ms | -0.96% |
| mean | 0.0012ms | 0.0013ms | -0.00011ms | -8.19% |
| min | 0.00083ms | 0.00088ms | -0.000042ms | -4.80% |
| max | 0.01ms | 0.01ms | -0.0033ms | -22.41% |
| total | 0.24ms | 0.26ms | -0.02ms | -8.19% |

### clientQuery

# Perf Report — clientQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00088ms |
| p50 | 0.00092ms |
| p95 | 0.0012ms |
| p99 | 0.0035ms |
| mean | 0.0010ms |
| stdev | 0.00070ms |
| min | 0.00088ms |
| max | 0.0098ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00088ms | 0.00092ms | -0.000041ms | -4.48% |
| p50 | 0.00092ms | 0.00096ms | -0.000041ms | -4.28% |
| p95 | 0.0012ms | 0.0018ms | -0.00067ms | -36.44% |
| p99 | 0.0035ms | 0.01ms | -0.0099ms | -74.01% |
| mean | 0.0010ms | 0.0015ms | -0.00051ms | -32.72% |
| min | 0.00088ms | 0.00088ms | 0.00ms | 0.00% |
| max | 0.0098ms | 0.06ms | -0.05ms | -84.16% |
| total | 0.21ms | 0.31ms | -0.10ms | -32.72% |

