# Perf Suite — graphql

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| parseGraphQLOperation | 0.00079ms | 0.0018ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| executeQuery | 0.0010ms | 0.0013ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| clientQuery | 0.00092ms | 0.0019ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| parseGraphQLOperation | 0.02ms | 10ms | PASS |
| executeQuery | 0.02ms | 10ms | PASS |
| clientQuery | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| parseGraphQLOperation | 3480 B | 0 B | 102400 B | yes | PASS |
| executeQuery | 28160 B | 0 B | 102400 B | yes | PASS |
| clientQuery | 13008 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### parseGraphQLOperation

# Perf Report — parseGraphQLOperation.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00079ms |
| p50 | 0.00083ms |
| p95 | 0.0018ms |
| p99 | 0.0080ms |
| mean | 0.0011ms |
| stdev | 0.0013ms |
| min | 0.00075ms |
| max | 0.01ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00079ms | 0.00079ms | +0.0000010ms | +0.13% |
| p50 | 0.00083ms | 0.00083ms | +5.0e-7ms | +0.06% |
| p95 | 0.0018ms | 0.0025ms | -0.00075ms | -30.01% |
| p99 | 0.0080ms | 0.0076ms | +0.00041ms | +5.40% |
| mean | 0.0011ms | 0.0013ms | -0.00015ms | -11.54% |
| min | 0.00075ms | 0.00075ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00033ms | -2.66% |
| total | 0.23ms | 0.26ms | -0.03ms | -11.54% |

### executeQuery

# Perf Report — executeQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0011ms |
| p95 | 0.0013ms |
| p99 | 0.0078ms |
| mean | 0.0013ms |
| stdev | 0.0012ms |
| min | 0.0010ms |
| max | 0.01ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0010ms | 0.00091ms | +0.00013ms | +14.16% |
| p50 | 0.0011ms | 0.0010ms | +0.000042ms | +4.03% |
| p95 | 0.0013ms | 0.0024ms | -0.0011ms | -47.25% |
| p99 | 0.0078ms | 0.0073ms | +0.00049ms | +6.76% |
| mean | 0.0013ms | 0.0013ms | -0.000028ms | -2.11% |
| min | 0.0010ms | 0.00088ms | +0.00013ms | +14.29% |
| max | 0.01ms | 0.01ms | -0.0028ms | -19.54% |
| total | 0.26ms | 0.26ms | -0.0055ms | -2.11% |

### clientQuery

# Perf Report — clientQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00092ms |
| p50 | 0.00096ms |
| p95 | 0.0019ms |
| p99 | 0.01ms |
| mean | 0.0012ms |
| stdev | 0.0016ms |
| min | 0.00088ms |
| max | 0.01ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00092ms | 0.00092ms | 0.00ms | 0.00% |
| p50 | 0.00096ms | 0.00096ms | 0.00ms | 0.00% |
| p95 | 0.0019ms | 0.0018ms | +0.000036ms | +1.94% |
| p99 | 0.01ms | 0.01ms | -0.00025ms | -1.86% |
| mean | 0.0012ms | 0.0015ms | -0.00031ms | -20.27% |
| min | 0.00088ms | 0.00088ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.06ms | -0.05ms | -77.63% |
| total | 0.25ms | 0.31ms | -0.06ms | -20.27% |

