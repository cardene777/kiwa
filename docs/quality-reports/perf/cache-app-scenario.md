# Perf Suite — cache-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.0095ms | 0.03ms | 30ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.02ms | 0.07ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.01ms | 0.02ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.05ms | 60ms | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.09ms | 200ms | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.05ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | -10040 B | 0 B | 102400 B | yes | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 1368 B | 0 B | 102400 B | yes | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 2280 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### read_heavy_workload (80 get / 20 set / 100 ops burst)

# Perf Report — read_heavy_workload (80 get / 20 set / 100 ops burst).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0095ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0060ms |
| min | 0.0093ms |
| max | 0.03ms |
| total | 0.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0095ms | 0.02ms | -0.0074ms | -43.93% |
| p50 | 0.02ms | 0.02ms | -0.0028ms | -14.53% |
| p95 | 0.03ms | 0.03ms | -0.0051ms | -16.34% |
| p99 | 0.03ms | 0.04ms | -0.01ms | -28.70% |
| mean | 0.02ms | 0.02ms | -0.0050ms | -23.24% |
| min | 0.0093ms | 0.01ms | -0.0054ms | -36.73% |
| max | 0.03ms | 0.04ms | -0.01ms | -32.50% |
| total | 0.50ms | 0.65ms | -0.15ms | -23.24% |

### pub_sub_burst (subscribe + 50 publish + drain)

# Perf Report — pub_sub_burst (subscribe + 50 publish + drain).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.03ms |
| p95 | 0.07ms |
| p99 | 0.09ms |
| mean | 0.03ms |
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.10ms |
| total | 1.01ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.000054ms | -0.26% |
| p50 | 0.03ms | 0.05ms | -0.02ms | -41.41% |
| p95 | 0.07ms | 1.16ms | -1.10ms | -94.34% |
| p99 | 0.09ms | 2.08ms | -1.99ms | -95.75% |
| mean | 0.03ms | 0.22ms | -0.19ms | -84.85% |
| min | 0.02ms | 0.02ms | -0.00067ms | -3.38% |
| max | 0.10ms | 2.40ms | -2.31ms | -95.96% |
| total | 1.01ms | 6.63ms | -5.63ms | -84.85% |

### ttl_expiry_cycle (set with TTL + get + assertTTL loop)

# Perf Report — ttl_expiry_cycle (set with TTL + get + assertTTL loop).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.08ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.10ms |
| total | 0.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00020ms | -1.55% |
| p50 | 0.01ms | 0.01ms | -0.00029ms | -2.12% |
| p95 | 0.02ms | 0.06ms | -0.04ms | -68.06% |
| p99 | 0.08ms | 0.10ms | -0.02ms | -24.09% |
| mean | 0.02ms | 0.02ms | -0.0040ms | -18.92% |
| min | 0.01ms | 0.01ms | -0.0015ms | -11.73% |
| max | 0.10ms | 0.11ms | -0.0078ms | -7.43% |
| total | 0.51ms | 0.63ms | -0.12ms | -18.92% |

