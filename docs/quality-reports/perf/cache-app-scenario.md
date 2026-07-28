# Perf Suite — cache-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.03ms | 30ms | PASS | stable (検知には +0.5ms (baseline 比 +1481%) 以上の悪化が必要) |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.06ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +500%) 以上の悪化が必要) |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.03ms | 30ms | PASS | stable (差 0.01ms が下限 0.5ms 未満で判定を保留) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.05ms | 60ms | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.07ms | 200ms | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.05ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | -11320 B | 0 B | 102400 B | yes | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | -14432 B | 0 B | 102400 B | yes | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 2280 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### read_heavy_workload (80 get / 20 set / 100 ops burst)

# Perf Report — read_heavy_workload (80 get / 20 set / 100 ops burst).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -18.77% |
| p95 | 0.03ms | 0.03ms | -0.01ms | -17.18% |
| p99 | 0.03ms | 0.04ms | -0.01ms | -27.68% |
| mean | 0.02ms | 0.02ms | -0.00ms | -17.90% |
| min | 0.01ms | 0.01ms | -0.01ms | -35.71% |
| max | 0.03ms | 0.04ms | -0.01ms | -31.71% |
| total | 0.53ms | 0.64ms | -0.12ms | -17.90% |

### pub_sub_burst (subscribe + 50 publish + drain)

# Perf Report — pub_sub_burst (subscribe + 50 publish + drain).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.03ms |
| p95 | 0.06ms |
| p99 | 0.08ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.08ms |
| total | 1.00ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.04ms | -0.01ms | -17.46% |
| p95 | 0.06ms | 0.10ms | -0.04ms | -41.83% |
| p99 | 0.08ms | 0.15ms | -0.07ms | -48.73% |
| mean | 0.03ms | 0.04ms | -0.01ms | -24.23% |
| min | 0.02ms | 0.02ms | -0.00ms | -10.80% |
| max | 0.08ms | 0.16ms | -0.08ms | -49.07% |
| total | 1.00ms | 1.32ms | -0.32ms | -24.23% |

### ttl_expiry_cycle (set with TTL + get + assertTTL loop)

# Perf Report — ttl_expiry_cycle (set with TTL + get + assertTTL loop).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.11ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.15ms |
| total | 0.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -1.63% |
| p95 | 0.03ms | 0.02ms | +0.01ms | +26.01% |
| p99 | 0.11ms | 0.02ms | +0.09ms | +362.98% |
| mean | 0.02ms | 0.02ms | +0.01ms | +35.37% |
| min | 0.01ms | 0.01ms | -0.00ms | -9.78% |
| max | 0.15ms | 0.02ms | +0.12ms | +487.42% |
| total | 0.61ms | 0.45ms | +0.16ms | +35.37% |

