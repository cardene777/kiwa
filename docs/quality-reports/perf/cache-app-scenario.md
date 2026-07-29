# Perf Suite — cache-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限はこの 2 倍 = 0.00042ms。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | gate | regression |
|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.01ms | 0.03ms | 30ms | PASS | improved — gate 無効 (regressionGate=false) |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.02ms | 0.06ms | 100ms | PASS | stable — gate 無効 (regressionGate=false) |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.01ms | 0.02ms | 30ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.06ms | 60ms | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.10ms | 200ms | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.13ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | -5336 B | 0 B | 102400 B | yes | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 1448 B | 0 B | 102400 B | yes | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 2200 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### read_heavy_workload (80 get / 20 set / 100 ops burst)

# Perf Report — read_heavy_workload (80 get / 20 set / 100 ops burst).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0055ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.0038ms | -22.38% |
| p50 | 0.02ms | 0.02ms | -0.0041ms | -21.37% |
| p95 | 0.03ms | 0.03ms | -0.0032ms | -10.24% |
| p99 | 0.03ms | 0.04ms | -0.0068ms | -18.10% |
| mean | 0.02ms | 0.02ms | -0.0038ms | -17.61% |
| min | 0.01ms | 0.01ms | -0.0035ms | -24.01% |
| max | 0.03ms | 0.04ms | -0.0083ms | -20.63% |
| total | 0.54ms | 0.65ms | -0.11ms | -17.61% |

### pub_sub_burst (subscribe + 50 publish + drain)

# Perf Report — pub_sub_burst (subscribe + 50 publish + drain).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.03ms |
| p95 | 0.06ms |
| p99 | 0.08ms |
| mean | 0.04ms |
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.09ms |
| total | 1.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.0034ms | +16.36% |
| p50 | 0.03ms | 0.05ms | -0.02ms | -32.56% |
| p95 | 0.06ms | 1.16ms | -1.10ms | -94.90% |
| p99 | 0.08ms | 2.08ms | -2.00ms | -95.95% |
| mean | 0.04ms | 0.22ms | -0.18ms | -83.21% |
| min | 0.02ms | 0.02ms | +0.0022ms | +11.18% |
| max | 0.09ms | 2.40ms | -2.31ms | -96.09% |
| total | 1.11ms | 6.63ms | -5.52ms | -83.21% |

### ttl_expiry_cycle (set with TTL + get + assertTTL loop)

# Perf Report — ttl_expiry_cycle (set with TTL + get + assertTTL loop).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.12ms |
| mean | 0.02ms |
| stdev | 0.03ms |
| min | 0.01ms |
| max | 0.16ms |
| total | 0.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00020ms | -1.52% |
| p50 | 0.01ms | 0.01ms | -0.00035ms | -2.57% |
| p95 | 0.02ms | 0.06ms | -0.04ms | -64.13% |
| p99 | 0.12ms | 0.10ms | +0.02ms | +24.13% |
| mean | 0.02ms | 0.02ms | -0.0013ms | -6.35% |
| min | 0.01ms | 0.01ms | +0.000042ms | +0.33% |
| max | 0.16ms | 0.11ms | +0.06ms | +56.19% |
| total | 0.59ms | 0.63ms | -0.04ms | -6.35% |

