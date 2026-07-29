# Perf Suite — graphql

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| parseGraphQLOperation | 0.00079ms | 0.0032ms | 5ms | 0.00033ms | PASS | stable (p10 +0% (閾値未満)、 p95 +28% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| executeQuery | 0.00092ms | 0.0019ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
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
| parseGraphQLOperation | -9816 B | 0 B | 102400 B | yes | PASS |
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
| p95 | 0.0032ms |
| p99 | 0.0083ms |
| mean | 0.0014ms |
| stdev | 0.0015ms |
| min | 0.00075ms |
| max | 0.01ms |
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00079ms | 0.00079ms | +0.0000010ms | +0.13% |
| p50 | 0.00088ms | 0.00083ms | +0.000041ms | +4.98% |
| p95 | 0.0032ms | 0.0025ms | +0.00070ms | +27.90% |
| p99 | 0.0083ms | 0.0076ms | +0.00075ms | +9.94% |
| mean | 0.0014ms | 0.0013ms | +0.000078ms | +6.08% |
| min | 0.00075ms | 0.00075ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00029ms | +2.34% |
| total | 0.27ms | 0.26ms | +0.02ms | +6.08% |

### executeQuery

# Perf Report — executeQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00092ms |
| p50 | 0.0010ms |
| p95 | 0.0019ms |
| p99 | 0.0063ms |
| mean | 0.0012ms |
| stdev | 0.0012ms |
| min | 0.00083ms |
| max | 0.01ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00092ms | 0.00091ms | +0.0000041ms | +0.45% |
| p50 | 0.0010ms | 0.0010ms | -0.000041ms | -3.94% |
| p95 | 0.0019ms | 0.0024ms | -0.00046ms | -19.20% |
| p99 | 0.0063ms | 0.0073ms | -0.0010ms | -14.20% |
| mean | 0.0012ms | 0.0013ms | -0.000067ms | -5.14% |
| min | 0.00083ms | 0.00088ms | -0.000042ms | -4.80% |
| max | 0.01ms | 0.01ms | -0.0024ms | -16.66% |
| total | 0.25ms | 0.26ms | -0.01ms | -5.14% |

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
| stdev | 0.00060ms |
| min | 0.00083ms |
| max | 0.0080ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00088ms | 0.00092ms | -0.000041ms | -4.48% |
| p50 | 0.00092ms | 0.00096ms | -0.000042ms | -4.38% |
| p95 | 0.0012ms | 0.0018ms | -0.00067ms | -36.44% |
| p99 | 0.0034ms | 0.01ms | -0.0099ms | -74.35% |
| mean | 0.0010ms | 0.0015ms | -0.00053ms | -34.38% |
| min | 0.00083ms | 0.00088ms | -0.000042ms | -4.80% |
| max | 0.0080ms | 0.06ms | -0.05ms | -87.13% |
| total | 0.20ms | 0.31ms | -0.11ms | -34.38% |

