# Perf Suite — graphql

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| parseGraphQLOperation | 0.00079ms | 0.0034ms | 5ms | 0.00033ms | PASS | stable (p10 +0% (閾値未満)、 p95 +37% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| executeQuery | 0.00088ms | 0.0024ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| clientQuery | 0.00092ms | 0.0013ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| parseGraphQLOperation | 0.02ms | 10ms | PASS |
| executeQuery | 0.02ms | 10ms | PASS |
| clientQuery | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| parseGraphQLOperation | -4000 B | 0 B | 102400 B | yes | PASS |
| executeQuery | 7712 B | 0 B | 102400 B | yes | PASS |
| clientQuery | 28064 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### parseGraphQLOperation

# Perf Report — parseGraphQLOperation.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00079ms |
| p50 | 0.00088ms |
| p95 | 0.0034ms |
| p99 | 0.0081ms |
| mean | 0.0014ms |
| stdev | 0.0016ms |
| min | 0.00075ms |
| max | 0.01ms |
| total | 0.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00079ms | 0.00079ms | +0.0000010ms | +0.13% |
| p50 | 0.00088ms | 0.00083ms | +0.000041ms | +4.98% |
| p95 | 0.0034ms | 0.0025ms | +0.00092ms | +36.66% |
| p99 | 0.0081ms | 0.0076ms | +0.00054ms | +7.10% |
| mean | 0.0014ms | 0.0013ms | +0.00011ms | +8.81% |
| min | 0.00075ms | 0.00075ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00067ms | +5.32% |
| total | 0.28ms | 0.26ms | +0.02ms | +8.81% |

### executeQuery

# Perf Report — executeQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00088ms |
| p50 | 0.0010ms |
| p95 | 0.0024ms |
| p99 | 0.01ms |
| mean | 0.0015ms |
| stdev | 0.0031ms |
| min | 0.00083ms |
| max | 0.04ms |
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00088ms | 0.00091ms | -0.000037ms | -4.05% |
| p50 | 0.0010ms | 0.0010ms | -0.000041ms | -3.94% |
| p95 | 0.0024ms | 0.0024ms | +0.0000020ms | +0.09% |
| p99 | 0.01ms | 0.0073ms | +0.0033ms | +45.29% |
| mean | 0.0015ms | 0.0013ms | +0.00015ms | +11.47% |
| min | 0.00083ms | 0.00088ms | -0.000042ms | -4.80% |
| max | 0.04ms | 0.01ms | +0.03ms | +188.22% |
| total | 0.29ms | 0.26ms | +0.03ms | +11.47% |

### clientQuery

# Perf Report — clientQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00092ms |
| p50 | 0.00096ms |
| p95 | 0.0013ms |
| p99 | 0.0041ms |
| mean | 0.0011ms |
| stdev | 0.00066ms |
| min | 0.00088ms |
| max | 0.0082ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00092ms | 0.00092ms | 0.00ms | 0.00% |
| p50 | 0.00096ms | 0.00096ms | 0.00ms | 0.00% |
| p95 | 0.0013ms | 0.0018ms | -0.00050ms | -27.41% |
| p99 | 0.0041ms | 0.01ms | -0.0092ms | -69.29% |
| mean | 0.0011ms | 0.0015ms | -0.00048ms | -31.31% |
| min | 0.00088ms | 0.00088ms | 0.00ms | 0.00% |
| max | 0.0082ms | 0.06ms | -0.05ms | -86.79% |
| total | 0.21ms | 0.31ms | -0.10ms | -31.31% |

