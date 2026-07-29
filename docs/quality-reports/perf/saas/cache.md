# Perf Suite — cache

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00042ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00083ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| redisEnvAccessor | 0.00033ms | 0.0017ms | 5ms | 0.00083ms | PASS | stable (差 0.00017ms が下限 0.00083ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| memcachedEnvAccessor | 0.00013ms | 0.00021ms | 5ms | 0.00083ms | PASS | stable (検知には +0.00083ms (baseline 比 +667%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| keydbEnvAccessor | 0.00013ms | 0.00025ms | 5ms | 0.00083ms | PASS | stable (検知には +0.00083ms (baseline 比 +667%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| redisEnvAccessor | 0.02ms | 10ms | PASS |
| memcachedEnvAccessor | 0.00ms | 10ms | PASS |
| keydbEnvAccessor | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| redisEnvAccessor | -13496 B | 0 B | 102400 B | yes | PASS |
| memcachedEnvAccessor | -16224 B | 0 B | 102400 B | yes | PASS |
| keydbEnvAccessor | 1016 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### redisEnvAccessor

# Perf Report — redisEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00046ms |
| p95 | 0.0017ms |
| p99 | 0.0079ms |
| mean | 0.00068ms |
| stdev | 0.0013ms |
| min | 0.00029ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00017ms | +0.00017ms | +100.60% |
| p50 | 0.00046ms | 0.00021ms | +0.00025ms | +120.67% |
| p95 | 0.0017ms | 0.0013ms | +0.00043ms | +32.97% |
| p99 | 0.0079ms | 0.0054ms | +0.0025ms | +46.77% |
| mean | 0.00068ms | 0.00036ms | +0.00033ms | +92.08% |
| min | 0.00029ms | 0.00013ms | +0.00017ms | +132.80% |
| max | 0.01ms | 0.0058ms | +0.0074ms | +127.31% |
| total | 0.14ms | 0.07ms | +0.07ms | +92.08% |

### memcachedEnvAccessor

# Perf Report — memcachedEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.00021ms |
| p99 | 0.00063ms |
| mean | 0.00017ms |
| stdev | 0.00010ms |
| min | 0.00013ms |
| max | 0.0013ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00017ms | 0.00017ms | -5.0e-7ms | -0.30% |
| p95 | 0.00021ms | 0.00021ms | +5.0e-8ms | +0.02% |
| p99 | 0.00063ms | 0.00059ms | +0.000034ms | +5.76% |
| mean | 0.00017ms | 0.00018ms | -0.0000085ms | -4.84% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.0013ms | 0.0021ms | -0.00079ms | -37.27% |
| total | 0.03ms | 0.04ms | -0.0017ms | -4.84% |

### keydbEnvAccessor

# Perf Report — keydbEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.00025ms |
| p99 | 0.0016ms |
| mean | 0.00026ms |
| stdev | 0.00082ms |
| min | 0.00013ms |
| max | 0.0092ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| p50 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p95 | 0.00025ms | 0.00038ms | -0.00013ms | -33.33% |
| p99 | 0.0016ms | 0.0031ms | -0.0015ms | -48.11% |
| mean | 0.00026ms | 0.0011ms | -0.00086ms | -76.61% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.0092ms | 0.16ms | -0.15ms | -94.31% |
| total | 0.05ms | 0.22ms | -0.17ms | -76.61% |

