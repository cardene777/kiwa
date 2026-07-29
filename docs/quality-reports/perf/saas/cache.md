# Perf Suite — cache

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| redisEnvAccessor | 0.00017ms | 0.00025ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +201%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| memcachedEnvAccessor | 0.00017ms | 0.00025ms | 5ms | 0.00033ms | PASS | stable (差 0.000041ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| keydbEnvAccessor | 0.00017ms | 0.00025ms | 5ms | 0.00033ms | PASS | stable (差 0.000041ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| redisEnvAccessor | 0.01ms | 10ms | PASS |
| memcachedEnvAccessor | 0.01ms | 10ms | PASS |
| keydbEnvAccessor | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| redisEnvAccessor | 3496 B | -50210 B | 102400 B | yes | PASS |
| memcachedEnvAccessor | -1384 B | 0 B | 102400 B | yes | PASS |
| keydbEnvAccessor | 10936 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### redisEnvAccessor

# Perf Report — redisEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.00025ms |
| p99 | 0.00059ms |
| mean | 0.00024ms |
| stdev | 0.00031ms |
| min | 0.00017ms |
| max | 0.0045ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | +0.0000010ms | +0.60% |
| p50 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p95 | 0.00025ms | 0.0013ms | -0.0010ms | -80.71% |
| p99 | 0.00059ms | 0.0054ms | -0.0048ms | -89.09% |
| mean | 0.00024ms | 0.00036ms | -0.00012ms | -33.54% |
| min | 0.00017ms | 0.00013ms | +0.000041ms | +32.80% |
| max | 0.0045ms | 0.0058ms | -0.0013ms | -21.58% |
| total | 0.05ms | 0.07ms | -0.02ms | -33.54% |

### memcachedEnvAccessor

# Perf Report — memcachedEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00025ms |
| p99 | 0.00084ms |
| mean | 0.00020ms |
| stdev | 0.00016ms |
| min | 0.00013ms |
| max | 0.0022ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00013ms | +0.000041ms | +32.80% |
| p50 | 0.00017ms | 0.00017ms | +5.0e-7ms | +0.30% |
| p95 | 0.00025ms | 0.00021ms | +0.000042ms | +20.19% |
| p99 | 0.00084ms | 0.00059ms | +0.00024ms | +41.19% |
| mean | 0.00020ms | 0.00018ms | +0.000022ms | +12.41% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.0022ms | 0.0021ms | +0.000042ms | +1.98% |
| total | 0.04ms | 0.04ms | +0.0044ms | +12.41% |

### keydbEnvAccessor

# Perf Report — keydbEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00025ms |
| p99 | 0.0029ms |
| mean | 0.00029ms |
| stdev | 0.00097ms |
| min | 0.00013ms |
| max | 0.01ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00013ms | +0.000041ms | +32.80% |
| p50 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p95 | 0.00025ms | 0.00038ms | -0.00013ms | -33.33% |
| p99 | 0.0029ms | 0.0031ms | -0.00021ms | -6.66% |
| mean | 0.00029ms | 0.0011ms | -0.00083ms | -73.83% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.16ms | -0.15ms | -92.80% |
| total | 0.06ms | 0.22ms | -0.17ms | -73.83% |

