# Perf Suite — cache

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| redisEnvAccessor | 0.00017ms | 0.00021ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +200%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| memcachedEnvAccessor | 0.00013ms | 0.00017ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| keydbEnvAccessor | 0.00013ms | 0.00017ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| redisEnvAccessor | 0.01ms | 10ms | PASS |
| memcachedEnvAccessor | 0.01ms | 10ms | PASS |
| keydbEnvAccessor | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| redisEnvAccessor | -152056 B | 0 B | 102400 B | yes | PASS |
| memcachedEnvAccessor | -488 B | 0 B | 102400 B | yes | PASS |
| keydbEnvAccessor | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### redisEnvAccessor

# Perf Report — redisEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00021ms |
| p99 | 0.00046ms |
| mean | 0.00021ms |
| stdev | 0.00031ms |
| min | 0.00013ms |
| max | 0.0046ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p50 | 0.00017ms | 0.00021ms | -0.000041ms | -19.71% |
| p95 | 0.00021ms | 0.0013ms | -0.0011ms | -83.72% |
| p99 | 0.00046ms | 0.0054ms | -0.0049ms | -91.45% |
| mean | 0.00021ms | 0.00036ms | -0.00015ms | -41.57% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.0046ms | 0.0058ms | -0.0012ms | -20.86% |
| total | 0.04ms | 0.07ms | -0.03ms | -41.57% |

### memcachedEnvAccessor

# Perf Report — memcachedEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.00017ms |
| p99 | 0.00050ms |
| mean | 0.00016ms |
| stdev | 0.00011ms |
| min | 0.00013ms |
| max | 0.0015ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00017ms | 0.00017ms | -5.0e-7ms | -0.30% |
| p95 | 0.00017ms | 0.00021ms | -0.000041ms | -19.71% |
| p99 | 0.00050ms | 0.00059ms | -0.000090ms | -15.21% |
| mean | 0.00016ms | 0.00018ms | -0.000018ms | -10.04% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.0015ms | 0.0021ms | -0.00063ms | -29.41% |
| total | 0.03ms | 0.04ms | -0.0035ms | -10.04% |

### keydbEnvAccessor

# Perf Report — keydbEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00017ms |
| p99 | 0.0025ms |
| mean | 0.00028ms |
| stdev | 0.0012ms |
| min | 0.00013ms |
| max | 0.01ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00013ms | 0.00017ms | -0.000042ms | -25.15% |
| p95 | 0.00017ms | 0.00038ms | -0.00021ms | -55.47% |
| p99 | 0.0025ms | 0.0031ms | -0.00056ms | -18.14% |
| mean | 0.00028ms | 0.0011ms | -0.00084ms | -75.13% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.16ms | -0.15ms | -91.15% |
| total | 0.06ms | 0.22ms | -0.17ms | -75.13% |

