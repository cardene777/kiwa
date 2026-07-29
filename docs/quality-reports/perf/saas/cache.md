# Perf Suite — cache

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| redisEnvAccessor | 0.00017ms | 0.00096ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +201%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| memcachedEnvAccessor | 0.00013ms | 0.00017ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +267%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| keydbEnvAccessor | 0.00013ms | 0.00021ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +267%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| redisEnvAccessor | 0.01ms | 10ms | PASS |
| memcachedEnvAccessor | 0.01ms | 10ms | PASS |
| keydbEnvAccessor | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| redisEnvAccessor | -12160 B | 0 B | 102400 B | yes | PASS |
| memcachedEnvAccessor | -264 B | 0 B | 102400 B | yes | PASS |
| keydbEnvAccessor | -16448 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### redisEnvAccessor

# Perf Report — redisEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.00096ms |
| p99 | 0.0021ms |
| mean | 0.00031ms |
| stdev | 0.00057ms |
| min | 0.00017ms |
| max | 0.0068ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | +0.0000010ms | +0.60% |
| p50 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p95 | 0.00096ms | 0.0013ms | -0.00033ms | -25.76% |
| p99 | 0.0021ms | 0.0054ms | -0.0032ms | -60.28% |
| mean | 0.00031ms | 0.00036ms | -0.000046ms | -12.96% |
| min | 0.00017ms | 0.00013ms | +0.000041ms | +32.80% |
| max | 0.0068ms | 0.0058ms | +0.0010ms | +17.97% |
| total | 0.06ms | 0.07ms | -0.0092ms | -12.96% |

### memcachedEnvAccessor

# Perf Report — memcachedEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00013ms |
| p95 | 0.00017ms |
| p99 | 0.00059ms |
| mean | 0.00016ms |
| stdev | 0.00013ms |
| min | 0.000083ms |
| max | 0.0017ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00013ms | 0.00017ms | -0.000041ms | -24.92% |
| p95 | 0.00017ms | 0.00021ms | -0.000041ms | -19.71% |
| p99 | 0.00059ms | 0.00059ms | -0.0000057ms | -0.96% |
| mean | 0.00016ms | 0.00018ms | -0.000018ms | -10.07% |
| min | 0.000083ms | 0.00013ms | -0.000042ms | -33.60% |
| max | 0.0017ms | 0.0021ms | -0.00042ms | -19.58% |
| total | 0.03ms | 0.04ms | -0.0035ms | -10.07% |

### keydbEnvAccessor

# Perf Report — keydbEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.00021ms |
| p99 | 0.0022ms |
| mean | 0.00030ms |
| stdev | 0.0013ms |
| min | 0.00013ms |
| max | 0.02ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00017ms | 0.00017ms | -0.0000010ms | -0.60% |
| p95 | 0.00021ms | 0.00038ms | -0.00017ms | -44.27% |
| p99 | 0.0022ms | 0.0031ms | -0.00085ms | -27.44% |
| mean | 0.00030ms | 0.0011ms | -0.00082ms | -73.60% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.16ms | -0.15ms | -90.25% |
| total | 0.06ms | 0.22ms | -0.16ms | -73.60% |

