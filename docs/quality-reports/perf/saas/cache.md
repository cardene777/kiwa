# Perf Suite — cache

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| redisEnvAccessor | 0.00017ms | 0.00025ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +200%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| memcachedEnvAccessor | 0.00013ms | 0.00017ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| keydbEnvAccessor | 0.00013ms | 0.00021ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| redisEnvAccessor | 0.01ms | 10ms | PASS |
| memcachedEnvAccessor | 0.00ms | 10ms | PASS |
| keydbEnvAccessor | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| redisEnvAccessor | -19696 B | 0 B | 102400 B | yes | PASS |
| memcachedEnvAccessor | -16464 B | 0 B | 102400 B | yes | PASS |
| keydbEnvAccessor | -296 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### redisEnvAccessor

# Perf Report — redisEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00025ms |
| p99 | 0.00075ms |
| mean | 0.00022ms |
| stdev | 0.00033ms |
| min | 0.00013ms |
| max | 0.0047ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p50 | 0.00017ms | 0.00021ms | -0.000041ms | -19.71% |
| p95 | 0.00025ms | 0.0013ms | -0.0010ms | -80.71% |
| p99 | 0.00075ms | 0.0054ms | -0.0046ms | -86.04% |
| mean | 0.00022ms | 0.00036ms | -0.00014ms | -39.11% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.0047ms | 0.0058ms | -0.0010ms | -17.99% |
| total | 0.04ms | 0.07ms | -0.03ms | -39.11% |

### memcachedEnvAccessor

# Perf Report — memcachedEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00017ms |
| p99 | 0.00063ms |
| mean | 0.00016ms |
| stdev | 0.00013ms |
| min | 0.00013ms |
| max | 0.0017ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00013ms | 0.00017ms | -0.000041ms | -24.92% |
| p95 | 0.00017ms | 0.00021ms | -0.000041ms | -19.71% |
| p99 | 0.00063ms | 0.00059ms | +0.000037ms | +6.18% |
| mean | 0.00016ms | 0.00018ms | -0.000019ms | -10.89% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.0017ms | 0.0021ms | -0.00042ms | -19.62% |
| total | 0.03ms | 0.04ms | -0.0038ms | -10.89% |

### keydbEnvAccessor

# Perf Report — keydbEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00021ms |
| p99 | 0.0020ms |
| mean | 0.00026ms |
| stdev | 0.0011ms |
| min | 0.000084ms |
| max | 0.01ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00013ms | 0.00017ms | -0.000042ms | -25.15% |
| p95 | 0.00021ms | 0.00038ms | -0.00017ms | -44.27% |
| p99 | 0.0020ms | 0.0031ms | -0.0011ms | -34.69% |
| mean | 0.00026ms | 0.0011ms | -0.00086ms | -76.60% |
| min | 0.000084ms | 0.00013ms | -0.000041ms | -32.80% |
| max | 0.01ms | 0.16ms | -0.15ms | -91.87% |
| total | 0.05ms | 0.22ms | -0.17ms | -76.60% |

