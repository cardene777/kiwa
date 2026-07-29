# Perf Suite — cache

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| redisEnvAccessor | 0.00017ms | 0.00029ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +200%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| memcachedEnvAccessor | 0.00013ms | 0.00021ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| keydbEnvAccessor | 0.00013ms | 0.00017ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| redisEnvAccessor | 0.03ms | 10ms | PASS |
| memcachedEnvAccessor | 0.01ms | 10ms | PASS |
| keydbEnvAccessor | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| redisEnvAccessor | -17824 B | 0 B | 102400 B | yes | PASS |
| memcachedEnvAccessor | -16464 B | 0 B | 102400 B | yes | PASS |
| keydbEnvAccessor | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### redisEnvAccessor

# Perf Report — redisEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00029ms |
| p99 | 0.00075ms |
| mean | 0.00022ms |
| stdev | 0.00033ms |
| min | 0.00017ms |
| max | 0.0048ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p50 | 0.00017ms | 0.00021ms | -0.000041ms | -19.71% |
| p95 | 0.00029ms | 0.0013ms | -0.0010ms | -77.47% |
| p99 | 0.00075ms | 0.0054ms | -0.0046ms | -86.06% |
| mean | 0.00022ms | 0.00036ms | -0.00013ms | -37.07% |
| min | 0.00017ms | 0.00013ms | +0.000041ms | +32.80% |
| max | 0.0048ms | 0.0058ms | -0.00096ms | -16.56% |
| total | 0.04ms | 0.07ms | -0.03ms | -37.07% |

### memcachedEnvAccessor

# Perf Report — memcachedEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.00021ms |
| p99 | 0.00054ms |
| mean | 0.00016ms |
| stdev | 0.00013ms |
| min | 0.000083ms |
| max | 0.0018ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00017ms | 0.00017ms | -5.0e-7ms | -0.30% |
| p95 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p99 | 0.00054ms | 0.00059ms | -0.000049ms | -8.26% |
| mean | 0.00016ms | 0.00018ms | -0.000011ms | -6.38% |
| min | 0.000083ms | 0.00013ms | -0.000042ms | -33.60% |
| max | 0.0018ms | 0.0021ms | -0.00033ms | -15.72% |
| total | 0.03ms | 0.04ms | -0.0022ms | -6.38% |

### keydbEnvAccessor

# Perf Report — keydbEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.00017ms |
| p99 | 0.0020ms |
| mean | 0.00027ms |
| stdev | 0.0011ms |
| min | 0.00013ms |
| max | 0.01ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00017ms | 0.00017ms | -0.0000010ms | -0.60% |
| p95 | 0.00017ms | 0.00038ms | -0.00021ms | -55.47% |
| p99 | 0.0020ms | 0.0031ms | -0.0011ms | -35.33% |
| mean | 0.00027ms | 0.0011ms | -0.00084ms | -75.46% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.16ms | -0.15ms | -91.87% |
| total | 0.05ms | 0.22ms | -0.17ms | -75.46% |

