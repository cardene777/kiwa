# Perf Suite — cache

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| redisEnvAccessor | 0.00017ms | 0.00029ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +200%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| memcachedEnvAccessor | 0.00013ms | 0.00017ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| keydbEnvAccessor | 0.00013ms | 0.00017ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +266%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| redisEnvAccessor | 0.01ms | 10ms | PASS |
| memcachedEnvAccessor | 0.00ms | 10ms | PASS |
| keydbEnvAccessor | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| redisEnvAccessor | -17776 B | 0 B | 102400 B | yes | PASS |
| memcachedEnvAccessor | -16464 B | 0 B | 102400 B | yes | PASS |
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
| p95 | 0.00029ms |
| p99 | 0.00050ms |
| mean | 0.00022ms |
| stdev | 0.00031ms |
| min | 0.00017ms |
| max | 0.0045ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p50 | 0.00017ms | 0.00021ms | -0.000041ms | -19.71% |
| p95 | 0.00029ms | 0.0013ms | -0.0010ms | -77.55% |
| p99 | 0.00050ms | 0.0054ms | -0.0049ms | -90.67% |
| mean | 0.00022ms | 0.00036ms | -0.00014ms | -39.54% |
| min | 0.00017ms | 0.00013ms | +0.000041ms | +32.80% |
| max | 0.0045ms | 0.0058ms | -0.0013ms | -21.58% |
| total | 0.04ms | 0.07ms | -0.03ms | -39.54% |

### memcachedEnvAccessor

# Perf Report — memcachedEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00017ms |
| p99 | 0.00050ms |
| mean | 0.00017ms |
| stdev | 0.00021ms |
| min | 0.00013ms |
| max | 0.0030ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00013ms | 0.00017ms | -0.000041ms | -24.92% |
| p95 | 0.00017ms | 0.00021ms | -0.000041ms | -19.71% |
| p99 | 0.00050ms | 0.00059ms | -0.000090ms | -15.14% |
| mean | 0.00017ms | 0.00018ms | -0.0000091ms | -5.20% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.0030ms | 0.0021ms | +0.00092ms | +43.11% |
| total | 0.03ms | 0.04ms | -0.0018ms | -5.20% |

### keydbEnvAccessor

# Perf Report — keydbEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00017ms |
| p99 | 0.0023ms |
| mean | 0.00028ms |
| stdev | 0.0012ms |
| min | 0.000083ms |
| max | 0.01ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00013ms | 0.00017ms | -0.000042ms | -25.15% |
| p95 | 0.00017ms | 0.00038ms | -0.00021ms | -54.92% |
| p99 | 0.0023ms | 0.0031ms | -0.00080ms | -26.08% |
| mean | 0.00028ms | 0.0011ms | -0.00084ms | -74.85% |
| min | 0.000083ms | 0.00013ms | -0.000042ms | -33.60% |
| max | 0.01ms | 0.16ms | -0.15ms | -91.61% |
| total | 0.06ms | 0.22ms | -0.17ms | -74.85% |

